import { HttpStatusCode } from "axios";
import {
  SpotifyUserProfileData,
  SpotifyErrorResponse,
  SpotifyPlaylists,
} from "./spotify.model.js";
import { spotifyLogger } from "../utils/logger.js";

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

// Offset is only used if the next url is not supplied.
async function getUserSpotifyPlaylists(
  accessToken: string,
  offset: number,
  next: string = `https://api.spotify.com/v1/me/playlists?offset=${offset}&limmit=50`
): Promise<SpotifyPlaylists> {
  spotifyLogger.debug(`Getting user spotify playlists at url ${next}`);
  const response = await fetch(next, {
    headers: {
      Authorization: "Bearer " + accessToken,
    },
  });

  if (response.status === HttpStatusCode.Ok) {
    const spotifyPlaylists: SpotifyPlaylists = await response.json();
    return spotifyPlaylists;
  } else {
    const spotifyErrorResponse: SpotifyErrorResponse = await response.json();
    throw new Error(
      `Status: ${spotifyErrorResponse.error.status}, Message: ${spotifyErrorResponse.error.message}`
    );
  }
}

export { getSpotifyProfile, getUserSpotifyPlaylists };
