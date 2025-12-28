import axios, { HttpStatusCode } from "axios";
import {
  SpotifyUserProfileData,
  SpotifyErrorResponse,
  SpotifyPlaylists,
  SpotifyTopTracks,
  SpotifyToken,
  SpotifySearchResult,
  SpotifySeveralArtists,
  SpotifyFollowedArtists,
  SpotifyPlaylistTracks,
  SpotifyArtistTopTracks,
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

// Offset and limit are only used if the next url is not supplied.
async function getSpotifyUserPlaylists(
  accessToken: string,
  offset: number,
  limit: number = 50,
  next: string = `https://api.spotify.com/v1/me/playlists?offset=${offset}&limit=${limit}`
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

// Offset and limit are only used if the next url is not supplied.
async function getSpotifyUserPlaylistTracks(
  accessToken: string,
  playlistId: string,
  offset: number,
  limit: number = 50,
  next: string = `
  https://api.spotify.com/v1/playlists/${playlistId}/tracks?offset=${offset}&limit=${limit}&fields=limit,next,offset,total,items(track)`
): Promise<SpotifyPlaylistTracks> {
  spotifyLogger.debug(`Getting user spotify playlist tracks at url ${next}`);
  const response = await fetch(next, {
    headers: {
      Authorization: "Bearer " + accessToken,
    },
  });

  if (response.status === HttpStatusCode.Ok) {
    const spotifyPlaylistTracks: SpotifyPlaylistTracks = await response.json();
    //We do this because we want to tell the frontend how far we've gone in the search.
    //The frontend can then call the endpoint again with the last offset it obtained to continue the search.
    spotifyPlaylistTracks.offset = offset + spotifyPlaylistTracks.items.length;
    return spotifyPlaylistTracks;
  } else {
    const spotifyErrorResponse: SpotifyErrorResponse = await response.json();
    throw new Error(
      `Status: ${spotifyErrorResponse.error.status}, Message: ${spotifyErrorResponse.error.message}`
    );
  }
}

// Offset and limit are only used if the next url is not supplied.
async function getSpotifyUserSavedTracks(
  accessToken: string,
  offset: number,
  limit: number = 50,
  next: string = `
  https://api.spotify.com/v1/me/tracks?offset=${offset}&limit=${limit}`
): Promise<SpotifyPlaylistTracks> {
  spotifyLogger.debug(`Getting user spotify saved tracks at url ${next}`);
  const response = await fetch(next, {
    headers: {
      Authorization: "Bearer " + accessToken,
    },
  });

  if (response.status === HttpStatusCode.Ok) {
    const spotifyPlaylistTracks: SpotifyPlaylistTracks = await response.json();
    //We do this because we want to tell the frontend how far we've gone in the search.
    //The frontend can then call the endpoint again with the last offset it obtained to continue the search.
    spotifyPlaylistTracks.offset = offset + spotifyPlaylistTracks.items.length;
    return spotifyPlaylistTracks;
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

async function getSpotifyArtistTopTracks(
  accessToken: string,
  artistId: string,
  market: string
): Promise<SpotifyArtistTopTracks> {
  spotifyLogger.debug(`Getting top tracks for artist ${artistId} in market ${market}`);
  const url = `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=${market}`;

  const response = await fetch(url, {
    headers: {
      Authorization: "Bearer " + accessToken,
    },
  });

  if (response.status === HttpStatusCode.Ok) {
    const spotifyArtistTopTracks: SpotifyArtistTopTracks = await response.json();
    return spotifyArtistTopTracks;
  } else {
    const spotifyErrorResponse: SpotifyErrorResponse = await response.json();
    throw new Error(
      `Status: ${spotifyErrorResponse.error.status}, Message: ${spotifyErrorResponse.error.message}`
    );
  }
}

async function addTracksToSpotifyUserPlaylist(
  accessToken: string,
  playlistId: string,
  uris: string[]
) {
  spotifyLogger.debug(`Adding to user spotify playlist ${playlistId}`);

  const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;

  const requestBody = {
    uris: uris,
  };

  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + accessToken,
    },
    body: JSON.stringify(requestBody),
  }).catch((error) => {
    console.error(error);
    throw new Error("Message: Failed to save track to playlist.");
  });
}

async function removeTracksFromSpotifyUserPlaylist(
  accessToken: string,
  playlistId: string,
  uris: string[]
): Promise<void> {
  spotifyLogger.debug(`Removing from user spotify playlist ${playlistId}`);

  const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;

  const requestBody = {
    tracks: uris.map((trackUri) => {
      return { uri: trackUri };
    }),
  };

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + accessToken,
    },
    body: JSON.stringify(requestBody),
  });

  if (response.status !== HttpStatusCode.Ok) {
    const spotifyErrorResponse: SpotifyErrorResponse = await response.json();
    throw new Error(
      `Status: ${spotifyErrorResponse.error.status}, Message: ${spotifyErrorResponse.error.message}`
    );
  }
}

async function addTracksToSpotifyUserSavedItems(
  accessToken: string,
  ids: string[]
) {
  spotifyLogger.debug(`Adding to user spotify saved items.`);

  const url = `https://api.spotify.com/v1/me/tracks`;

  const requestBody = {
    ids: ids,
  };

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + accessToken,
    },
    body: JSON.stringify(requestBody),
  });

  if (response.status !== HttpStatusCode.Ok) {
    const spotifyErrorResponse: SpotifyErrorResponse = await response.json();
    throw new Error(
      `Status: ${spotifyErrorResponse.error.status}, Message: ${spotifyErrorResponse.error.message}`
    );
  }
}

async function removeTracksFromSpotifyUserSavedItems(
  accessToken: string,
  ids: string[]
) {
  spotifyLogger.debug(`Adding to user spotify saved items.`);

  const url = `https://api.spotify.com/v1/me/tracks`;

  const requestBody = {
    ids: ids,
  };

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + accessToken,
    },
    body: JSON.stringify(requestBody),
  });

  if (response.status !== HttpStatusCode.Ok) {
    const spotifyErrorResponse: SpotifyErrorResponse = await response.json();
    throw new Error(
      `Status: ${spotifyErrorResponse.error.status}, Message: ${spotifyErrorResponse.error.message}`
    );
  }
}

async function searchSpotify(
  accessToken: string,
  q: string,
  playlistOnly: boolean
): Promise<SpotifySearchResult> {
  spotifyLogger.debug(`Searching spotify for:: ${q}`);
  const url = `https://api.spotify.com/v1/search?q=${q}&type=${
    playlistOnly ? "" : "artist,"
  }playlist`;

  const response = await fetch(url, {
    headers: {
      Authorization: "Bearer " + accessToken,
    },
  });

  if (response.status === HttpStatusCode.Ok) {
    const spotifySearchResult: SpotifySearchResult = await response.json();
    return spotifySearchResult;
  } else {
    const spotifyErrorResponse: SpotifyErrorResponse = await response.json();
    throw new Error(
      `Status: ${spotifyErrorResponse.error.status}, Message: ${spotifyErrorResponse.error.message}`
    );
  }
}

async function getSpotifySeveralArtists(
  accessToken: string,
  artistsIds: string[]
): Promise<SpotifySeveralArtists> {
  spotifyLogger.debug(
    `Getting ${artistsIds.length} artists details from Spotify.`
  );
  const ids = artistsIds.join();
  const url = `https://api.spotify.com/v1/artists?ids=${ids}`;

  const response = await fetch(url, {
    headers: {
      Authorization: "Bearer " + accessToken,
    },
  });

  if (response.status === HttpStatusCode.Ok) {
    const spotifySeveralArtists: SpotifySeveralArtists = await response.json();
    return spotifySeveralArtists;
  } else {
    const spotifyErrorResponse: SpotifyErrorResponse = await response.json();
    throw new Error(
      `Status: ${spotifyErrorResponse.error.status}, Message: ${spotifyErrorResponse.error.message}`
    );
  }
}

async function getSpotifyFollowedArtists(
  accessToken: string,
  limit: number
): Promise<SpotifyFollowedArtists> {
  spotifyLogger.debug(`Getting artists followed from Spotify.`);
  const url = `https://api.spotify.com/v1/me/following?type=artist&limit=${limit}`;

  const response = await fetch(url, {
    headers: {
      Authorization: "Bearer " + accessToken,
    },
  });

  if (response.status === HttpStatusCode.Ok) {
    const spotifyFollowedArtists: SpotifyFollowedArtists =
      await response.json();
    return spotifyFollowedArtists;
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
  getSpotifyArtistTopTracks,
  addTracksToSpotifyUserPlaylist,
  removeTracksFromSpotifyUserPlaylist,
  addTracksToSpotifyUserSavedItems,
  removeTracksFromSpotifyUserSavedItems,
  requestSpotifyAccessToken,
  refreshSpotifyAccessToken,
  searchSpotify,
  getSpotifySeveralArtists,
  getSpotifyFollowedArtists,
  getSpotifyUserPlaylistTracks,
  getSpotifyUserSavedTracks,
};
