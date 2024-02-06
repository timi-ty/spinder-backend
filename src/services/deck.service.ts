import {
  attachPresenceWatcher,
  batchSetFirestoreCollection,
  deleteFirestoreDoc,
  getFirestoreCollectionSize,
  listenToFirestoreCollection,
  setFirestoreDoc,
} from "../firebase/firebase.spinder.js";
import { getSpotifyUserTopTracks } from "../spotify/spotify.api.js";
import { getSpinderUserData } from "../user/user.utils.js";
import { deckLogger } from "../utils/logger.js";

const sourceDeckThresholdSize = 50; // The deck service tries to maintain each user's sourceDeck at this size.
const curatorUnsubMap: Map<string, () => void> = new Map();

function startDeckService() {
  attachPresenceWatcher(onPresenceChanged);
  attachCurator();
}

function onPresenceChanged(userId: string, isOnline: boolean) {
  if (isOnline) onUserActive(userId);
  else onUserInactive(userId);
}

async function onUserActive(userId: string) {
  try {
    await setFirestoreDoc(`activeUsers/${userId}`, {});
  } catch (error) {
    console.error(error);
    deckLogger.error(
      `Deck service failed to assuredly add now online user ${userId} to the active users collection.`
    );
  }
}

async function onUserInactive(userId: string) {
  try {
    await deleteFirestoreDoc(`activeUsers/${userId}`);
  } catch (error) {
    console.error(error);
    deckLogger.error(
      `Deck service failed to assuredly remove now offline user ${userId} from the active users collection.`
    );
  }
}

//Add a mechanism that ensures this recursive chain is not dispatched more than once per user at a time.
async function progressivelyFillUpSourceDeck(userId: string) {
  try {
    //Starts the deck filling callback chain which ends when the user reaches their desired deck size.
    const sourceDeckCollectionPath = `users/${userId}/sourceDeck`;
    const sourceDeckSize = await getFirestoreCollectionSize(
      sourceDeckCollectionPath
    );
    deckLogger.debug(
      `User ${userId} has ${sourceDeckSize} items in their deck.`
    );
    if (sourceDeckSize >= sourceDeckThresholdSize) {
      return;
    }
    deckLogger.debug(
      `User ${userId} is filling up to reach ${sourceDeckThresholdSize}.`
    );
    const accessToken = (await getSpinderUserData(userId))?.accessToken || "";

    //The method to be called for getting deck new tracks will be an API from a sophisticated system that takes in the user's discover source type and spits out a list of tracks.
    const deckNewTracks = await getSpotifyUserTopTracks(accessToken, 0);
    const deckNewTracksMap: Map<string, DeckItem> = new Map();
    deckNewTracks.items.forEach((topTrack) => {
      deckNewTracksMap.set(topTrack.id, {
        image:
          topTrack.album.images.length > 0 ? topTrack.album.images[0].url : "",
        previewUrl: topTrack.preview_url,
        trackName: topTrack.name,
        trackUrl: topTrack.uri,
        artistName: topTrack.artists[0].name,
        artistUrl: topTrack.artists[0].uri,
        trackId: topTrack.id,
      });
    });
    if (deckNewTracksMap.size < 1) {
      throw new Error(
        "0 new tracks gotten from Spotify. The query may need to be adjusted."
      );
    }
    deckLogger.debug(
      `Adding ${
        deckNewTracksMap.size
      } tracks to deck for user ${userId}, Tracks: ${JSON.stringify(
        deckNewTracksMap
      )}`
    );
    await batchSetFirestoreCollection(
      sourceDeckCollectionPath,
      deckNewTracksMap
    );
    progressivelyFillUpSourceDeck(userId);
  } catch (error) {
    //Filling up a user's deck is an important but expendable process since it runs repeatedly. If it fails, it fails quietly and takes no further action.
    console.error(error);
    deckLogger.warn(
      `An error occured while fillng up source deck for user ${userId}. Aborting this cycle...`
    );
  }
}

async function attachCurator() {
  //Calls progressivelyFillUpDeck for every user in the activeUsers collection.
  //Calls progressivelyFillUpDeck everytime a user in the activeUsers collection removes an item from their sourceDeck.
  listenToFirestoreCollection("activeUsers", (snapshot) => {
    snapshot.docChanges().forEach(async (change) => {
      if (change.type === "added") {
        const userId = change.doc.id;
        deckLogger.debug(`Found new active user ${userId}.`);
        progressivelyFillUpSourceDeck(userId); //Dispatch for different users without awaiting.
        const sourceDeckCollectionPath = `users/${userId}/sourceDeck`;
        const sourceDeckListenerUnsub = listenToFirestoreCollection(
          sourceDeckCollectionPath,
          (snapshot) => {
            snapshot.docChanges().forEach(async (change) => {
              if (change.type === "removed") {
                deckLogger.debug(
                  `User ${userId} removed ${change.doc.id} from their source deck.`
                );
                await progressivelyFillUpSourceDeck(userId); //Each user has to await each deck fill process.
              }
            });
          }
        );
        curatorUnsubMap.set(userId, sourceDeckListenerUnsub);
      }
      if (change.type === "removed") {
        const userId = change.doc.id;
        deckLogger.debug(
          `Lost formerly active user ${userId}. Unsubscribing their source deck listener...`
        );
        const unsub = curatorUnsubMap.get(userId) || null;
        if (unsub) unsub();
      }
    });
  });
}

export { startDeckService };
