import {
  getFirestoreDoc,
  setFirestoreDoc,
} from "../firebase/firebase.spinder.js";
import { SpinderUserData, defaultSpinderUserData } from "./user.model.js";
import { userMarkerLog } from "../utils/logger.js";

async function updateOrCreateSpinderUserData(
  userId: string,
  accessToken: string
): Promise<SpinderUserData> {
  var spinderUserData = await getFirestoreDoc<SpinderUserData>(
    `users/${userId}`
  );

  if (spinderUserData === null) {
    spinderUserData = { ...defaultSpinderUserData };
    spinderUserData.accessToken = accessToken;
    await setFirestoreDoc(`users/${userId}`, spinderUserData, false);
    userMarkerLog(
      `Set default Spinder user data at users/${userId} with defaultData - ${JSON.stringify(
        spinderUserData
      )}`
    );
    return spinderUserData;
  } else {
    spinderUserData.accessToken = accessToken;
    await setFirestoreDoc(`users/${userId}`, spinderUserData, false);
    userMarkerLog(
      `Updated existing Spinder user data at users/${userId}, data - ${JSON.stringify(
        spinderUserData
      )}`
    );
    return spinderUserData;
  }
}

async function getSpinderUserData(
  userId: string
): Promise<SpinderUserData | null> {
  return getFirestoreDoc<SpinderUserData>(`users/${userId}`);
}

async function setSpinderUserData(
  userId: string,
  spinderUserData: SpinderUserData,
  merge = true
): Promise<void> {
  return setFirestoreDoc(`users/${userId}`, spinderUserData, merge);
}

export {
  updateOrCreateSpinderUserData,
  getSpinderUserData,
  setSpinderUserData,
};
