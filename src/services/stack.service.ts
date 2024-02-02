import {
  attachPresenceWatcher,
  deleteFirestoreDoc,
  setFirestoreDoc,
} from "../firebase/firebase.spinder";
import { stackLogger } from "../utils/logger";

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

function attachCurator() {}
