import { HttpStatusCode } from "axios";
import {
  getFirestoreDocData,
  setFirestoreDocData,
} from "../firebase/firebase.spinder.js";
import {
  SpinderUserData,
  SpotifyUserProfileData,
  defaultSpinderUserData,
} from "./user.model.js";
import { SpotifyErrorResponse } from "../utils/utils.js";
import { userMarkerLog } from "../utils/logger.js";

async function getSpotifyProfile(
  accessToken: string
): Promise<SpotifyUserProfileData> {
  const response = await fetch("https://api.spotify.com/v1/me", {
    headers: {
      Authorization: "Bearer " + accessToken,
    },
  });

  if (response.status === HttpStatusCode.Ok) {
    const spotifyUserProfileData: SpotifyUserProfileData =
      await response.json();
    return spotifyUserProfileData;
  } else {
    const spotifyErrorResponse: SpotifyErrorResponse = await response.json();
    throw new Error(
      `Status: ${spotifyErrorResponse.error.status}, Message: ${spotifyErrorResponse.error.message}`
    );
  }
}

async function getOrCreateSpinderUserData(
  userId: string
): Promise<SpinderUserData> {
  var spinderUserData = await getFirestoreDocData<SpinderUserData>(
    `users/${userId}`
  );

  if (spinderUserData === null) {
    await setFirestoreDocData(`users/${userId}`, defaultSpinderUserData, true);
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
  return setFirestoreDocData(`users/${userId}`, spinderUserData, merge);
}

export { getSpotifyProfile, getOrCreateSpinderUserData, setSpinderUserData };
