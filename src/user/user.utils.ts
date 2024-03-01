import {
  getFirestoreDoc,
  isExistingFirestoreDoc,
  setFirestoreDoc,
} from "../firebase/firebase.spinder.js";
import { SpinderUserData, defaultSpinderUserData } from "./user.model.js";
import { userMarkerLog } from "../utils/logger.js";

//Returns the user data and whether or not this is a newly created user.
async function updateOrCreateSpinderUserData(
  userId: string,
  displayName: string | null,
  image: string | null,
  accessToken: string,
  refreshToken: string
): Promise<[SpinderUserData, boolean]> {
  var spinderUserData = await getFirestoreDoc<SpinderUserData>(
    `users/${userId}`
  );

  if (spinderUserData === null) {
    spinderUserData = { ...defaultSpinderUserData };
    spinderUserData.accessToken = accessToken;
    spinderUserData.refreshToken = refreshToken;
    if (displayName) spinderUserData.name = displayName;
    if (image) spinderUserData.image = image;
    await setFirestoreDoc(`users/${userId}`, spinderUserData, false);
    userMarkerLog(
      `Set default Spinder user data at users/${userId} with defaultData - ${JSON.stringify(
        spinderUserData
      )}`
    );
    return [spinderUserData, true];
  } else {
    spinderUserData.accessToken = accessToken;
    spinderUserData.refreshToken = refreshToken;
    if (displayName) spinderUserData.name = displayName;
    if (image) spinderUserData.image = image;
    await setFirestoreDoc(`users/${userId}`, spinderUserData, false);
    userMarkerLog(
      `Updated existing Spinder user data at users/${userId}, data - ${JSON.stringify(
        spinderUserData
      )}`
    );
    return [spinderUserData, false];
  }
}

async function getSpinderUserData(userId: string): Promise<SpinderUserData> {
  const userData = await getFirestoreDoc<SpinderUserData>(`users/${userId}`);
  if (!userData) {
    throw new Error(`Data for user ${userId} does not exist.`);
  }
  return userData;
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
