import {
  attachPresenceWatcher,
  deleteFirestoreDoc,
  getFirestoreCollection,
  setFirestoreDoc,
} from "../firebase/firebase.spinder.js";
import { stackLogger } from "../utils/logger.js";

const sourceStackThresholdSize = 50; // The stack service tries to maintain each user's sourceStack at this size.

function startStackService() {
  attachPresenceWatcher(onPresenceChanged);
}

function onPresenceChanged(userId: string, isOnline: boolean) {
  if (isOnline) onUserActive(userId);
  else onUserInactive(userId);
}

async function onUserActive(userId: string) {
  try {
    await deleteFirestoreDoc(`passiveUsers/${userId}`);
  } catch (error) {
    stackLogger.error(error);
    stackLogger.error(
      `Stack service failed to assuredly remove now online user ${userId} from the passive users collection.`
    );
  }
  try {
    await setFirestoreDoc(`activeUsers/${userId}`, {});
  } catch (error) {
    stackLogger.error(error);
    stackLogger.error(
      `Stack service failed to assuredly add now online user ${userId} to the active users collection.`
    );
  }
}

async function onUserInactive(userId: string) {
  try {
    await deleteFirestoreDoc(`activeUsers/${userId}`);
  } catch (error) {
    stackLogger.error(error);
    stackLogger.error(
      `Stack service failed to assuredly remove now offline user ${userId} from the active users collection.`
    );
  }
  try {
    await setFirestoreDoc(`passiveUsers/${userId}`, {});
  } catch (error) {
    stackLogger.error(error);
    stackLogger.error(
      `Stack service failed to assuredly add now offline user ${userId} to the passive users collection.`
    );
  }
}

async function progressivelyFillUpSourceStack(userId: string) {
  //Starts the stack filling callback chain which only end when the user reaches their desired stack size.
  const sourceStackCollectionPath = `users/${userId}/sourceStack`;
  const sourceStack = await getFirestoreCollection(sourceStackCollectionPath);
  if (sourceStack.size >= sourceStackThresholdSize) {
    return;
  }
}

async function attachCurator(isForActiveUsers: boolean) {
  //Calls progressivelyFillUpStack for every user in either the activeUsers collection or the passiveUsers collection.
  while (true) {
    //This becomes impractical for a large number of users. The stack service will need to be structured in a way that it can be horizontally scaled.
    const curatorUsers = await (isForActiveUsers
      ? getFirestoreCollection("activeUsers")
      : getFirestoreCollection("passiveUsers"));

    stackLogger.debug(
      `Starting a new curator cycle for ${curatorUsers.size} ${
        isForActiveUsers ? "active" : "passive"
      } users.`
    );

    curatorUsers.forEach((doc) => {
      progressivelyFillUpSourceStack(doc.id);
    });
  }
}

export { startStackService };
