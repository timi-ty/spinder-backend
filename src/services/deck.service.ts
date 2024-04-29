import {
  DiscoverDestination,
  DiscoverSource,
} from "../discover/discover.model.js";
import {
  attachPresenceWatcher,
  batchSetFirestoreDocs,
  clearFirestoreCollection,
  deleteFirestoreDoc,
  getFirestoreCollectionSize,
  isExistingFirestoreDoc,
  setFirestoreDoc,
} from "../firebase/firebase.spinder.js";
import {
  getSpotifyUserPlaylistTracks,
  getSpotifyUserSavedTracks,
} from "../spotify/spotify.api.js";
import { deckLogger } from "../utils/logger.js";
import { getDeckTracks } from "./deck.filler.js";
import { DeckItem } from "./deck.model.js";

const sourceDeckMinSize = 20;
const sourceDeckFillerSet: Set<string> = new Set();
const destDeckEnumeratorSet: Set<string> = new Set();

function startDeckService() {
  attachPresenceWatcher(onPresenceChanged); //Currently, a user's presence is only useful for the deck filler, which is why it is attached here.
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

async function isUserOnline(userId: string): Promise<boolean> {
  return await isExistingFirestoreDoc(`activeUsers/${userId}`);
}

async function refillSourceDeck(
  userId: string,
  accessToken: string,
  selectedDiscoverSource: DiscoverSource
) {
  if (sourceDeckFillerSet.has(userId)) {
    deckLogger.warn(
      `Another deck filler is currently running for user ${userId}. Aborting this one...`
    );
    return;
  }
  sourceDeckFillerSet.add(userId);

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
      sourceDeckFillerSet.delete(userId);
      return;
    }

    const newDeckItems = await getDeckTracks(
      selectedDiscoverSource,
      accessToken
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
    console.error(error);
    deckLogger.warn(
      `An error occured while fillng up source deck for user ${userId}. Aborting this refill...`
    );
  }
  sourceDeckFillerSet.delete(userId);
}

async function resetSourceDeck(
  userId: string,
  accessToken: string,
  selectedSource: DiscoverSource
) {
  await clearFirestoreCollection(`users/${userId}/sourceDeck`);
  refillSourceDeck(userId, accessToken, selectedSource);
}

async function resetDestinationDeck(
  userId: string,
  accessToken: string,
  selectedDiscoverDestination: DiscoverDestination
) {
  if (destDeckEnumeratorSet.has(userId)) {
    deckLogger.warn(
      `Another deck enumerator is currently running for user ${userId}. Aborting this one...`
    );
    return;
  }
  destDeckEnumeratorSet.add(userId);
  const destDeckCollectionPath = `users/${userId}/destinationDeck`;
  const destDeckItemsMap: Map<string, {}> = new Map();

  await clearFirestoreCollection(destDeckCollectionPath);

  try {
    if (selectedDiscoverDestination.isFavourites) {
      var savedTracks = await getSpotifyUserSavedTracks(accessToken, 0, 50);
      savedTracks.items.forEach((item) =>
        destDeckItemsMap.set(item.track.id, {})
      );
      const maxIterations = 10; //If you have more than 550 items in your playlist, spinder will ignore the rest :)
      for (var i = 0; i < maxIterations; i++) {
        if (!savedTracks.next) break;
        savedTracks = await getSpotifyUserPlaylistTracks(
          accessToken,
          selectedDiscoverDestination.id,
          -1,
          -1,
          savedTracks.next
        );
        savedTracks.items.forEach((item) =>
          destDeckItemsMap.set(item.track.id, {})
        );
      }
    } else {
      var playlistTracks = await getSpotifyUserPlaylistTracks(
        accessToken,
        selectedDiscoverDestination.id,
        0,
        50
      );
      playlistTracks.items.forEach((item) =>
        destDeckItemsMap.set(item.track.id, {})
      );
      const maxIterations = 10; //If you have more than 550 items in your playlist, spinder will ignore the rest :)
      for (var i = 0; i < maxIterations; i++) {
        if (!playlistTracks.next) break;
        playlistTracks = await getSpotifyUserPlaylistTracks(
          accessToken,
          selectedDiscoverDestination.id,
          -1,
          -1,
          playlistTracks.next
        );
        playlistTracks.items.forEach((item) =>
          destDeckItemsMap.set(item.track.id, {})
        );
      }
    }

    deckLogger.debug(
      `Enumerating ${
        destDeckItemsMap.size
      } items to destination deck for user ${userId}, Deck Items: ${JSON.stringify(
        destDeckItemsMap
      )}`
    );
    await batchSetFirestoreDocs(destDeckCollectionPath, destDeckItemsMap);
  } catch (error) {
    //If an error occurs while enumerating the destination deck, the like feature works partially but sufficiently. If it fails, it fails quietly and takes no further action.
    console.error(error);
    deckLogger.warn(
      `An error occured while enumerating destination deck for user ${userId}. Aborting the enumeration...`
    );
  }
  destDeckEnumeratorSet.delete(userId);
}

export {
  startDeckService,
  refillSourceDeck,
  resetSourceDeck,
  resetDestinationDeck,
  isUserOnline,
};
