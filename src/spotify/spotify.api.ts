import axios, { HttpStatusCode } from "axios";
import {
  SpotifyUserProfileData,
  SpotifyErrorResponse,
  SpotifyPlaylists,
  SpotifyTopTracks,
  SpotifyToken,
  SpotifyRecommendations,
  Track,
} from "./spotify.model.js";
import { spotifyLogger } from "../utils/logger.js";

// Always remember to check that the required scopes are requested when using a new Spotify API.

async function requestSpotifyAccessToken(code: string): Promise<SpotifyToken> {
  var authOptions = {
    url: "https://accounts.spotify.com/api/token",
    form: {
      code: code,
      redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
      grant_type: "authorization_code",
    },
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(
          process.env.SPOTIFY_CLIENT_ID +
            ":" +
            process.env.SPOTIFY_CLIENT_SECRET
        ).toString("base64"),
    },
    json: true,
  };

  const response = await axios.post(authOptions.url, authOptions.form, {
    headers: authOptions.headers,
  });

  if (response.status === HttpStatusCode.Ok) {
    return response.data;
  } else {
    throw new Error(
      `Spotify rejected login - Status: ${response.status}, Message - ${response.data.error.message}`
    );
  }
}

async function refreshSpotifyAccessToken(
  refreshToken: string
): Promise<SpotifyToken> {
  var authOptions = {
    url: "https://accounts.spotify.com/api/token",
    form: {
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    },
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(
          process.env.SPOTIFY_CLIENT_ID +
            ":" +
            process.env.SPOTIFY_CLIENT_SECRET
        ).toString("base64"),
    },
    json: true,
  };

  const response = await axios.post(authOptions.url, authOptions.form, {
    headers: authOptions.headers,
  });

  if (response.status === HttpStatusCode.Ok) {
    const spotifyToken: SpotifyToken = response.data;
    spotifyToken.refresh_token = refreshToken; //Spotify does not issue a new refresh token.
    return spotifyToken;
  } else {
    throw new Error(
      `Spotify rejected refresh login - Status: ${response.status}, Message - ${response.data.error.message}`
    );
  }
}

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
    //We do this because we want to tell the frontend how far we've gone in the search.
    //The frontend can then call the endpoint again with the last offset it obtained to continue the search.
    spotifyPlaylists.offset = offset + spotifyPlaylists.items.length;
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
  limit: number,
  next: string = `https://api.spotify.com/v1/me/top/tracks?offset=${offset}&limit=${limit}`
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

async function getSpotifyRecommendations(
  accessToken: string,
  seedTracks: Track[],
  limit: number
): Promise<SpotifyRecommendations> {
  spotifyLogger.debug(`Getting user spotify top recommendations.`);
  const seedTrackIds = seedTracks.map((track) => track.id).join();
  var url = `https://api.spotify.com/v1/recommendations?limit=${limit}&seed_tracks=${seedTrackIds}`;
  const response = await fetch(url, {
    headers: {
      Authorization: "Bearer " + accessToken,
    },
  });

  if (response.status === HttpStatusCode.Ok) {
    const spotifyReocommendations: SpotifyRecommendations =
      await response.json();
    return spotifyReocommendations;
  } else {
    const spotifyErrorResponse: SpotifyErrorResponse = await response.json();
    throw new Error(
      `Status: ${spotifyErrorResponse.error.status}, Message: ${spotifyErrorResponse.error.message}`
    );
  }
}

function addTracksToSpotifyUserPlaylist(
  accessToken: string,
  playlistId: string,
  uris: string[],
  onTracksAdded: () => void = () => {}
) {
  spotifyLogger.debug(`Adding to user spotify playlist ${playlistId}`);

  var requestOptions = {
    url: `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
    form: {
      uris: uris,
    },
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + accessToken,
    },
    json: true,
  };

  axios
    .post(requestOptions.url, requestOptions.form, {
      headers: requestOptions.headers,
    })
    .then((response) => {
      if (response.status === HttpStatusCode.Created) {
        spotifyLogger.debug(
          `Added ${uris.length} tracks to playlist ${playlistId}.`
        );
        onTracksAdded();
        return;
      }
    })
    .catch((error) => {
      if (error.response) {
        const spotifyErrorResponse: SpotifyErrorResponse = error.response.data;
        spotifyLogger.error(
          `Error adding tracks to playlist for user. Status: ${
            spotifyErrorResponse.error.status
          }, Message: ${JSON.stringify(spotifyErrorResponse.error.message)}`
        );
      } else {
        console.log(error);
      }
    });
}

// Offset is only used if the next url is not supplied.
async function searchSpotify(
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

export {
  getSpotifyUserProfile,
  getSpotifyUserPlaylists,
  getSpotifyUserTopTracks,
  addTracksToSpotifyUserPlaylist,
  requestSpotifyAccessToken,
  refreshSpotifyAccessToken,
  getSpotifyRecommendations,
};
