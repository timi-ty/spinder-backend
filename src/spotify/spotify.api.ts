import { HttpStatusCode } from "axios";
import {
  SpotifyUserProfileData,
  SpotifyErrorResponse,
  SpotifyPlaylists,
  SpotifyTopTracks,
} from "./spotify.model.js";
import { spotifyLogger, spotifyMarkerLog } from "../utils/logger.js";

// Always remember to check that the required scopes are requested when using a new Spotify API.

async function getSpotifyUserProfile(
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
async function getSpotifyUserPlaylists(
  accessToken: string,
  offset: number,
  next: string = `https://api.spotify.com/v1/me/playlists?offset=${offset}&limit=50`
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

async function getSpotifyUserTopTracks(
  accessToken: string,
  offset: number,
  next: string = `https://api.spotify.com/v1/me/top/tracks?offset=${offset}&limit=50`
): Promise<SpotifyTopTracks> {
  spotifyLogger.debug(`Getting user spotify top tracks at url ${next}`);
  const response = await fetch(next, {
    headers: {
      Authorization: "Bearer " + accessToken,
    },
  });

  if (response.status === HttpStatusCode.Ok) {
    const spotifyPlaylists: SpotifyTopTracks = await response.json();
    return spotifyPlaylists;
  } else {
    const spotifyErrorResponse: SpotifyErrorResponse = await response.json();
    throw new Error(
      `Status: ${spotifyErrorResponse.error.status}, Message: ${spotifyErrorResponse.error.message}`
    );
  }
}

export {
  getSpotifyUserProfile,
  getSpotifyUserPlaylists,
  getSpotifyUserTopTracks,
};
