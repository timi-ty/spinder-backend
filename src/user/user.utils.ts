import {
  getFirestoreDoc,
  setFirestoreDoc,
} from "../firebase/firebase.spinder.js";
import { SpinderUserData, defaultSpinderUserData } from "./user.model.js";
import { userMarkerLog } from "../utils/logger.js";

async function getOrCreateSpinderUserData(
  userId: string
): Promise<SpinderUserData> {
  var spinderUserData = await getFirestoreDoc<SpinderUserData>(
    `users/${userId}`
  );

  if (spinderUserData === null) {
    await setFirestoreDoc(`users/${userId}`, defaultSpinderUserData, true);
    userMarkerLog(
      `Set default Spinder user data at users/${userId} with defaultData - ${JSON.stringify(
        defaultSpinderUserData
      )}`
    );
    return defaultSpinderUserData;
  } else {
    userMarkerLog(
      `Returning existing Spinder user data at users/${userId}, data - ${JSON.stringify(
        spinderUserData
      )}`
    );
    return spinderUserData;
  }
}

async function setSpinderUserData(
  userId: string,
  spinderUserData: SpinderUserData,
  merge = true
): Promise<void> {
  return setFirestoreDoc(`users/${userId}`, spinderUserData, merge);
}

export { getOrCreateSpinderUserData, setSpinderUserData };
