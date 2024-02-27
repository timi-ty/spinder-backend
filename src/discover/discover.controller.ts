import { Request, Response } from "express";
import {
  SpinderServerError,
  okResponse,
  safeParseJson,
} from "../utils/utils.js";
import {
  DiscoverDestination,
  DiscoverSource,
  DiscoverSourceData,
  DiscoverSourceSearchResult,
} from "./discover.model.js";
import { HttpStatusCode } from "axios";
import {
  updateOrCreateSpinderUserData,
  setSpinderUserData,
} from "../user/user.utils.js";
import { getCountOrAllOwnedSpotifyPlaylists } from "./discover.util.js";
import {
  clearFirestoreCollection,
  updateFirestoreDoc,
} from "../firebase/firebase.spinder.js";
import { searchSpotify } from "../spotify/spotify.api.js";

//Get the list of currently allowed discover destinations. The user's destination selection is part of the response.
async function getDiscoverDestinations(
  req: Request,
  res: Response,
  next: (error: SpinderServerError) => void
) {
  try {
    const accessToken = req.cookies.spinder_spotify_access_token || null;
    const userId = req.cookies.userId || null;
    const offset = +(req.query.offset || "0");
    const discoverDestinations = await getCountOrAllOwnedSpotifyPlaylists(
      accessToken,
      userId,
      10,
      offset
    );
    const userData = await updateOrCreateSpinderUserData(userId, accessToken);
    if (
      userData.selectedDiscoverDestination.id === "" &&
      discoverDestinations.availableDestinations.length > 0
    ) {
      userData.selectedDiscoverDestination =
        discoverDestinations.availableDestinations[0];
      await setSpinderUserData(userId, userData);
    }
    discoverDestinations.selectedDestination =
      userData.selectedDiscoverDestination;
    okResponse(req, res, discoverDestinations);
  } catch (error) {
    console.error(error);
    next(
      new SpinderServerError(
        HttpStatusCode.InternalServerError,
        new Error(
          "Failed to assemble reponse. This is most likely a spotify query failure."
        )
      )
    );
  }
}

async function setDiscoverDestination(
  req: Request,
  res: Response,
  next: (error: SpinderServerError) => void
) {
  const destination = req.query.destination || null;
  const userId = req.cookies.userId || null;
  try {
    if (!destination) throw new Error("Invalid destination."); //Replace with more sophisticated validation.
    const data: DiscoverDestination = safeParseJson(destination as string); //as string should no longer be needed if destination is properly validated.
    await updateFirestoreDoc(`users/${userId}`, {
      selectedDiscoverDestination: data,
    });
    okResponse(req, res, data);
  } catch (error) {
    console.error(error);
    next(
      new SpinderServerError(
        HttpStatusCode.InternalServerError,
        new Error(
          "Failed to set destination. This is most likely a db write failure."
        )
      )
    );
  }
}

//Get the list of currently allowed discover source types from the Spinder App Database. The user's source type selection should be marked in the response.
async function getDiscoverSourceTypes(
  req: Request,
  res: Response,
  next: (error: SpinderServerError) => void
) {
  try {
    const accessToken = req.cookies.spinder_spotify_access_token || null;
    const userId = req.cookies.userId || null;
    const userData = await updateOrCreateSpinderUserData(userId, accessToken);
    var discoverSourceTypesData: DiscoverSourceData = {
      selectedSource: userData.selectedDiscoverSource,
      availableSources: [
        {
          type: "Anything Me",
          id: "Anything Me",
          name: "Anything Me",
          image: "",
        },
        {
          type: "Spinder People",
          id: "Spinder People",
          name: "Spinder People",
          image: "",
        },
        {
          type: "My Artists",
          id: "My Artists",
          name: "My Artists",
          image: "",
        },
        {
          type: "My Playlists",
          id: "My Playlists",
          name: "My Playlists",
          image: "",
        },
      ],
    };
    okResponse(req, res, discoverSourceTypesData);
  } catch (error) {
    console.error(error);
    next(
      new SpinderServerError(
        HttpStatusCode.InternalServerError,
        new Error(
          "Failed to assemble reponse. This is most likely a db query failure."
        )
      )
    );
  }
}

async function searchDiscoverSources(
  req: Request,
  res: Response,
  next: (error: SpinderServerError) => void
) {
  try {
    const q = req.query.q || "";
    const accessToken = req.cookies.spinder_spotify_access_token || "";

    const spotifySearchResult = searchSpotify(accessToken, q as string);
    const artistSources = (await spotifySearchResult).artists.items.map(
      (artist) => {
        const artistSource: DiscoverSource = {
          type: "Artist",
          id: artist.id,
          name: artist.name,
          image: artist.images.length > 0 ? artist.images[0].url : "",
        };
        return artistSource;
      }
    );
    const playlistSources = (await spotifySearchResult).playlists.items.map(
      (playlist) => {
        const playlistSource: DiscoverSource = {
          type: "Playlist",
          id: playlist.id,
          name: playlist.name,
          image: playlist.images[0].url ?? "",
        };
        return playlistSource;
      }
    );
    const searchResult: DiscoverSourceSearchResult = {
      artists: artistSources,
      playlists: playlistSources,
    };
    okResponse(req, res, searchResult);
  } catch (error) {
    console.error(error);
    next(
      new SpinderServerError(
        HttpStatusCode.InternalServerError,
        new Error("Failed to search.")
      )
    );
  }
}

async function setDiscoverSource(
  req: Request,
  res: Response,
  next: (error: SpinderServerError) => void
) {
  const source = req.query.source || null;
  const userId = req.cookies.userId || null;
  try {
    if (!source) throw new Error("Invalid source."); //Replace with more sophisticated validation.
    const data: DiscoverSource = safeParseJson(source as string); //as sring should no longer be needed if destination is properly validated.
    await updateFirestoreDoc(`users/${userId}`, {
      selectedDiscoverSource: data,
    });
    await clearFirestoreCollection(`users/${userId}/sourceDeck`);
    await okResponse(req, res, data);
  } catch (error) {
    console.error(error);
    next(
      new SpinderServerError(
        HttpStatusCode.InternalServerError,
        new Error(
          "Failed to set source. This is most likely a db write failure."
        )
      )
    );
  }
}

export {
  getDiscoverSourceTypes,
  searchDiscoverSources,
  setDiscoverSource,
  getDiscoverDestinations,
  setDiscoverDestination,
};
