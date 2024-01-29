import {
  getFirestoreDocData,
  setFirestoreDocData,
} from "../firebase/firebase.spinder.js";
import { statusOk } from "../utils/utils.js";
import {
  SpinderUserData,
  SpotifyUserProfileData,
  defaultSpinderUserData,
} from "./user.model.js";

async function getSpotifyProfile(
  accessToken: string
): Promise<SpotifyUserProfileData> {
  const response = await fetch("https://api.spotify.com/v1/me", {
    headers: {
      Authorization: "Bearer " + accessToken,
    },
  });

  const spotifyUserProfileData: SpotifyUserProfileData = await response.json();

  if (statusOk(response.status)) {
    console.log(
      `Got Spotify profile, Name - ${spotifyUserProfileData.display_name}, Email - ${spotifyUserProfileData.email}`
    );
    return spotifyUserProfileData;
  } else {
    throw new Error(JSON.stringify(spotifyUserProfileData));
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

    return defaultSpinderUserData;
  } else {
    return spinderUserData;
  }
}

export { getSpotifyProfile, getOrCreateSpinderUserData };
