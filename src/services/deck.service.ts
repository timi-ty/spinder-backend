import {
  attachPresenceWatcher,
  batchDeleteFirestoreDocs,
  batchSetFirestoreDocs,
  deleteFirestoreDoc,
  getFirestoreCollectionSize,
  listenToFirestoreCollection,
  setFirestoreDoc,
} from "../firebase/firebase.spinder.js";
import { addTracksToSpotifyUserPlaylist } from "../spotify/spotify.api.js";
import { getSpinderUserData } from "../user/user.utils.js";
import { deckLogger } from "../utils/logger.js";
import { getDeckTracks } from "./deck.filler.js";
import { DeckItem } from "./deck.model.js";

const sourceDeckThresholdSize = 50; // The deck service tries to maintain each user's sourceDeck at this size.
const sourceDeckMinSize = 20;
const sourceDeckListenerMap: Map<string, () => void> = new Map();
const yesDeckListenerMap: Map<string, () => void> = new Map();
const deckFillerSet: Set<string> = new Set();

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

async function refillSourceDeck(userId: string) {
  if (deckFillerSet.has(userId)) {
    deckLogger.warn(
      `Another deck filler is currently running for user ${userId}. Aborting this one...`
    );
    return;
  }
  deckFillerSet.add(userId);

  try {
    const sourceDeckCollectionPath = `users/${userId}/sourceDeck`;
    const sourceDeckSize = await getFirestoreCollectionSize(
      sourceDeckCollectionPath
    );
    deckLogger.debug(
      `User ${userId} had ${sourceDeckSize} items in their deck.`
    );

    if (sourceDeckSize > sourceDeckMinSize) {
      deckLogger.debug(
        `User ${userId}'s source deck is full enough. Aborting refill...`
      );
      deckFillerSet.delete(userId);
      return;
    }

    const userData = await getSpinderUserData(userId);

    const newDeckItems = await getDeckTracks(
      userData.selectedDiscoverSource,
      userData.accessToken
    );
    const newDeckItemsMap: Map<string, DeckItem> = new Map();
    newDeckItems.forEach((deckItem) => {
      newDeckItemsMap.set(deckItem.trackId, deckItem);
    });
    if (newDeckItemsMap.size < 1) {
      throw new Error(
        "0 new tracks gotten from Spotify. The query may need to be adjusted."
      );
    }
    deckLogger.debug(
      `Adding ${
        newDeckItemsMap.size
      } tracks to deck for user ${userId}, Tracks: ${JSON.stringify(
        newDeckItemsMap
      )}`
    );
    await batchSetFirestoreDocs(sourceDeckCollectionPath, newDeckItemsMap);
  } catch (error) {
    //Filling up a user's deck is an important but expendable process since it runs repeatedly. If it fails, it fails quietly and takes no further action.
    deckFillerSet.delete(userId);
    console.error(error);
    deckLogger.warn(
      `An error occured while fillng up source deck for user ${userId}. Aborting this refill...`
    );
  }
  deckFillerSet.delete(userId);
}

async function attachCurator() {
  //Calls progressivelyFillUpDeck for every user in the activeUsers collection.
  //Attaches listeners on the source deck and the yes deck.
  listenToFirestoreCollection("activeUsers", (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        const userId = change.doc.id;
        deckLogger.debug(`Found new active user ${userId}.`);
        refillSourceDeck(userId); //Dispatch for different users without awaiting.
        attachSourceDeckListener(userId);
        attachYesDeckListener(userId);
      }
      if (change.type === "removed") {
        const userId = change.doc.id;
        deckLogger.debug(
          `Lost formerly active user ${userId}. Unsubscribing their deck listeners...`
        );
        const unsubSource = sourceDeckListenerMap.get(userId) || null;
        const unsubYes = yesDeckListenerMap.get(userId) || null;
        if (unsubSource) unsubSource();
        if (unsubYes) unsubYes();
      }
    });
  });
}

//Calls progressivelyFillUpDeck if the user's  source tracks < sourceDeckMinSize and the user just removed a track.
function attachSourceDeckListener(userId: string) {
  const sourceDeckCollectionPath = `users/${userId}/sourceDeck`;
  const sourceDeckListenerUnsub = listenToFirestoreCollection(
    sourceDeckCollectionPath,
    (snapshot) => {
      var hasRemoval = false;
      snapshot.docChanges().forEach((change) => {
        if (change.type === "removed") {
          deckLogger.debug(
            `User ${userId} removed ${change.doc.id} from their source deck.`
          );
          hasRemoval = true;
        }
      });
      if (hasRemoval && snapshot.size < sourceDeckMinSize)
        refillSourceDeck(userId);
    }
  );
  sourceDeckListenerMap.set(userId, sourceDeckListenerUnsub);
}

//Transfers tracks from the yes deck to the user's destination every time it detects a change.
function attachYesDeckListener(userId: string) {
  const yesDeckCollectionPath = `users/${userId}/yesDeck`;
  const yesDeckListenerUnsub = listenToFirestoreCollection(
    yesDeckCollectionPath,
    async (snapshot) => {
      const newTracks: DeckItem[] = [];
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          deckLogger.debug(
            `User ${userId} added ${change.doc.id} to their yes deck.`
          );
          newTracks.push(change.doc.data() as DeckItem);
        }
      });
      if (newTracks.length < 1) return;
      try {
        const spinderUserData = await getSpinderUserData(userId);
        const onTracksAdded = () => {
          batchDeleteFirestoreDocs(
            yesDeckCollectionPath,
            newTracks.map((track) => track.trackId)
          );
        };
        addTracksToSpotifyUserPlaylist(
          spinderUserData?.accessToken || "",
          spinderUserData?.selectedDiscoverDestination?.id || "",
          newTracks.map((track) => track.trackUri),
          onTracksAdded
        );
      } catch (error) {
        console.error(error);
        deckLogger.warn(
          `An error occured while saving the yes deck for user ${userId} to their selected playlist. Aborting this attempt...`
        );
      }
    }
  );
  yesDeckListenerMap.set(userId, yesDeckListenerUnsub);
}

export { startDeckService };
