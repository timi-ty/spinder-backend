import {
  getFirestoreDoc,
  setFirestoreDoc,
} from "../firebase/firebase.spinder.js";
import { SpinderUserData, defaultSpinderUserData } from "./user.model.js";
import { userMarkerLog } from "../utils/logger.js";
import { Request } from "express";
import { getAdminAccessToken } from "../services/admin.service.js";
import { defaultAnonDiscoverSource } from "../discover/discover.radio.js";

//Returns the user data and whether or not this is a newly created user.
async function updateOrCreateSpinderUserData(
  userId: string,
  displayName: string | null,
  image: string | null,
  accessToken: string | null,
  refreshToken: string | null,
  isAnon: boolean
): Promise<[SpinderUserData, boolean]> {
  var spinderUserData = await getFirestoreDoc<SpinderUserData>(
    `users/${userId}`
  );
  if (spinderUserData === null) {
    spinderUserData = { ...defaultSpinderUserData };
    if (isAnon)
      spinderUserData.selectedDiscoverSource = defaultAnonDiscoverSource();
    userMarkerLog(
      `Setting default Spinder user data at users/${userId} with defaultData`
    );
  } else {
    userMarkerLog(`Updating existing Spinder user data at users/${userId}`);
  }

  spinderUserData.accessToken = accessToken || "";
  spinderUserData.refreshToken = refreshToken || "";
  spinderUserData.isAnon = isAnon;
  if (displayName) spinderUserData.name = displayName;
  if (image) spinderUserData.image = image;
  await setFirestoreDoc(`users/${userId}`, spinderUserData, false);
  return [spinderUserData, false];
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

function isAnonUser(req: Request): boolean {
  const anonUserId = req.cookies.anon_user_id || null;
  const spinderAccessToken = req.cookies.spinder_spotify_access_token || null;

  return anonUserId && !spinderAccessToken;
}

async function getAuthOrAnonAccessToken(req: Request): Promise<string> {
  return isAnonUser(req)
    ? await getAdminAccessToken()
    : req.cookies.spinder_spotify_access_token || "";
}

export {
  updateOrCreateSpinderUserData,
  getAuthOrAnonAccessToken,
  isAnonUser,
  getSpinderUserData,
  setSpinderUserData,
};
