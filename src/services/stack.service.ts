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
import { stackLogger } from "../utils/logger.js";

const sourceStackThresholdSize = 50; // The stack service tries to maintain each user's sourceStack at this size.
const curatorUnsubMap: Map<string, () => void> = new Map();

function startStackService() {
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
    stackLogger.error(
      `Stack service failed to assuredly add now online user ${userId} to the active users collection.`
    );
  }
}

async function onUserInactive(userId: string) {
  try {
    await deleteFirestoreDoc(`activeUsers/${userId}`);
  } catch (error) {
    console.error(error);
    stackLogger.error(
      `Stack service failed to assuredly remove now offline user ${userId} from the active users collection.`
    );
  }
}

async function progressivelyFillUpSourceStack(userId: string) {
  try {
    //Starts the stack filling callback chain which only end when the user reaches their desired stack size.
    const sourceStackCollectionPath = `users/${userId}/sourceStack`;
    const sourceStackSize = await getFirestoreCollectionSize(
      sourceStackCollectionPath
    );
    stackLogger.debug(
      `User ${userId} has ${sourceStackSize} items in their stack.`
    );
    if (sourceStackSize >= sourceStackThresholdSize) {
      return;
    }
    stackLogger.debug(
      `User ${userId} is filling up to reach ${sourceStackThresholdSize}.`
    );
    const accessToken = (await getSpinderUserData(userId))?.accessToken || "";

    //The method to be called for getting stack new tracks will be an API from a sophisticated system that takes in the user's discover source type and spits out a list of tracks.
    const stackNewTracks = await getSpotifyUserTopTracks(accessToken, 0);
    const stackNewTracksMap: Map<string, object> = new Map();
    stackNewTracks.items.forEach((topTrack) => {
      stackNewTracksMap.set(topTrack.id, {});
    });
    stackLogger.debug(
      `Adding tracks to stack for user ${userId}, Tracks: ${JSON.stringify(
        stackNewTracksMap
      )}`
    );
    batchSetFirestoreCollection(sourceStackCollectionPath, stackNewTracksMap);
    progressivelyFillUpSourceStack(userId);
  } catch (error) {
    //Filling up a user's stack is an important but expendable process since it runs repeatedly. If it fails, it fails quietly and takes no further action.
    console.error(error);
    stackLogger.warn(
      `An error occured while fillng up source stack for user ${userId}. Aborting this cycle...`
    );
  }
}

async function attachCurator() {
  //Calls progressivelyFillUpStack for every user in the activeUsers collection.
  listenToFirestoreCollection("activeUsers", (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        const userId = change.doc.id;
        stackLogger.debug(`Found new active user ${userId}.`);
        progressivelyFillUpSourceStack(userId);
        const sourceStackCollectionPath = `users/${userId}/sourceStack`;
        const sourceStackListenerUnsub = listenToFirestoreCollection(
          sourceStackCollectionPath,
          (snapshot) => {
            snapshot.docChanges().forEach((change) => {
              if (change.type === "removed") {
                stackLogger.debug(
                  `User ${userId} removed ${change.doc.id} from their source stack.`
                );
                progressivelyFillUpSourceStack(change.doc.id);
              }
            });
          }
        );
        curatorUnsubMap.set(userId, sourceStackListenerUnsub);
      }
      if (change.type === "removed") {
        const userId = change.doc.id;
        stackLogger.debug(
          `Lost formerly active user ${userId}. Unsubscribing their source stack listener...`
        );
        const unsub = curatorUnsubMap.get(userId) || null;
        if (unsub) unsub();
      }
    });
  });
}

export { startStackService };
