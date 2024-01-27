import { statusOk } from "../utils/utils.js";
import { UserProfileData } from "./user.model.js";

export async function getSpotifyProfile(
  accessToken: string
): Promise<UserProfileData> {
  const response = await fetch("https://api.spotify.com/v1/me", {
    headers: {
      Authorization: "Bearer " + accessToken,
    },
  });

  const jsonResponse = await response.json();

  if (statusOk(response.status)) {
    return jsonResponse;
  } else {
    throw new Error(JSON.stringify(jsonResponse));
  }
}
