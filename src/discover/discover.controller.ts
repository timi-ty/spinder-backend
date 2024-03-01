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
import { updateOrCreateSpinderUserData } from "../user/user.utils.js";
import { getCountOrAllOwnedSpotifyPlaylistsAsDiscoverDestinations } from "./discover.util.js";
import {
  clearFirestoreCollection,
  deleteFirestoreDoc,
  setFirestoreDoc,
  stringSearchFirestoreCollection,
  updateFirestoreDoc,
} from "../firebase/firebase.spinder.js";
import {
  addTracksToSpotifyUserPlaylist,
  addTracksToSpotifyUserSavedItems,
  removeTracksFromSpotifyUserPlaylist,
  removeTracksFromSpotifyUserSavedItems,
  searchSpotify,
} from "../spotify/spotify.api.js";
import {
  enumerateDestinationDeck,
  refillSourceDeck,
} from "../services/deck.service.js";
import { DeckItem } from "../services/deck.model.js";
import { SpinderUserData } from "../user/user.model.js";

//Get the list of currently allowed discover destinations. The user's destination selection is part of the response.
async function getDiscoverDestinations(
  req: Request,
  res: Response,
  next: (error: SpinderServerError) => void
) {
  try {
    const accessToken: string =
      req.cookies.spinder_spotify_access_token || null;
    const userId: string = req.cookies.userId || null;
    const offset: number = +(req.query.offset || "0");
    const discoverDestinations =
      await getCountOrAllOwnedSpotifyPlaylistsAsDiscoverDestinations(
        accessToken,
        userId,
        10,
        offset
      );
    const refreshToken: string =
      req.cookies.spinder_spotify_refresh_token || null;
    const userData = await updateOrCreateSpinderUserData(
      userId,
      null, //Leave the current name there.
      null, // Leave the current image there.
      accessToken,
      refreshToken
    );
    discoverDestinations.selectedDestination =
      userData.selectedDiscoverDestination;
    //Add favourites as the first destination
    const destinationFavourites: DiscoverDestination = {
      name: "Favourites",
      image: "src/assets/ic_favourites_heart.svg", //TODO: look into hosting app level images on firebase storage
      id: "favourites",
      isFavourites: true,
    };
    discoverDestinations.availableDestinations.unshift(destinationFavourites);
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
  const userId: string = req.cookies.userId || null;
  const accessToken: string = req.cookies.spinder_spotify_access_token || "";
  try {
    if (!destination) throw new Error("Invalid destination."); //Replace with more sophisticated validation.
    const discoverDestination: DiscoverDestination = safeParseJson(
      destination as string
    ); //as string should no longer be needed if destination is properly validated.
    await updateFirestoreDoc(`users/${userId}`, {
      selectedDiscoverDestination: discoverDestination,
    });
    enumerateDestinationDeck(userId, accessToken, discoverDestination);
    okResponse(req, res, discoverDestination);
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
    const accessToken: string =
      req.cookies.spinder_spotify_access_token || null;
    const userId: string = req.cookies.userId || null;
    const refreshToken: string =
      req.cookies.spinder_spotify_refresh_token || null;
    const userData = await updateOrCreateSpinderUserData(
      userId,
      null, // Leave the current name there.
      null, // Leave the current image there.
      accessToken,
      refreshToken
    );
    var discoverSourceTypesData: DiscoverSourceData = {
      selectedSource: userData.selectedDiscoverSource,
      availableSources: [
        {
          type: "Anything Me",
          id: "anythingme",
          name: "Anything Me",
          image: "",
        },
        {
          type: "Spinder People",
          id: "spinderpeople",
          name: "Spinder People",
          image: "",
        },
        {
          type: "My Artists",
          id: "myartists",
          name: "My Artists",
          image: "",
        },
        {
          type: "My Playlists",
          id: "myplaylists",
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
    const accessToken: string = req.cookies.spinder_spotify_access_token || "";

    const spotifySearchResult = await searchSpotify(accessToken, q as string);
    const artistSources = spotifySearchResult.artists.items.map((artist) => {
      const artistSource: DiscoverSource = {
        type: "Artist",
        id: artist.id,
        name: artist.name,
        image: artist.images.length > 0 ? artist.images[0].url : "",
      };
      return artistSource;
    });
    const playlistSources = spotifySearchResult.playlists.items.map(
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
    const spinderPeopleSources = (
      await stringSearchFirestoreCollection("users", "name", q as string)
    ).docs.map((doc) => {
      const spinderUserData: SpinderUserData = doc.data() as SpinderUserData;
      const spinderPersonSource: DiscoverSource = {
        type: "Spinder Person",
        id: doc.id,
        name: spinderUserData.name,
        image: spinderUserData.image,
      };
      return spinderPersonSource;
    });
    const searchResult: DiscoverSourceSearchResult = {
      searchText: q as string,
      foundVibe: playlistSources.length > 0, //We may want to check for an actual number of available tracks
      artists: artistSources, //We may want to filter artists to use only artists with a minimum discography size
      playlists: playlistSources, //We may want to filter playlists to use only playlists with a minimum track count
      spinderPeople: spinderPeopleSources,
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
  const userId: string = req.cookies.userId || null;
  const accessToken: string = req.cookies.spinder_spotify_access_token || "";
  const source = req.query.source || null;
  try {
    if (!source) throw new Error("Invalid source."); //Replace with more sophisticated validation.
    const selectedSource: DiscoverSource = safeParseJson(source as string); //as sring should no longer be needed if source is properly validated.
    await updateFirestoreDoc(`users/${userId}`, {
      selectedDiscoverSource: selectedSource,
    });
    await clearFirestoreCollection(`users/${userId}/sourceDeck`);
    refillSourceDeck(userId, accessToken, selectedSource); //Dispatches and responds immediately. The frontend listens to the source deck filling up.
    okResponse(req, res, selectedSource);
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

async function refreshSourceDeck(
  req: Request,
  res: Response,
  next: (error: SpinderServerError) => void
) {
  const userId: string = req.cookies.userId || null;
  const accessToken: string = req.cookies.spinder_spotify_access_token || "";
  const source = req.query.source || null;
  try {
    if (!source) throw new Error("Invalid source."); //Replace with more sophisticated validation.
    const selectedSource: DiscoverSource = safeParseJson(source as string); //as sring should no longer be needed if source is properly validated.
    refillSourceDeck(userId, accessToken, selectedSource); //Dispatches and responds immediately. The frontend listens to the source deck filling up.
    okResponse(req, res, selectedSource);
  } catch (error) {
    console.error(error);
    next(
      new SpinderServerError(
        HttpStatusCode.InternalServerError,
        new Error(
          "Failed to refresh source deck. This is most likely a db write failure."
        )
      )
    );
  }
}

async function refreshDestinationDeck(
  req: Request,
  res: Response,
  next: (error: SpinderServerError) => void
) {
  const userId: string = req.cookies.userId || null;
  const accessToken: string = req.cookies.spinder_spotify_access_token || "";
  const destination = req.query.destination || null;
  try {
    if (!destination) throw new Error("Invalid destination."); //Replace with more sophisticated validation.
    const selectedDestination: DiscoverDestination = safeParseJson(
      destination as string
    ); //as sring should no longer be needed if destination is properly validated.
    enumerateDestinationDeck(userId, accessToken, selectedDestination); //Dispatches and responds immediately. The frontend listens to the source deck filling up.
    okResponse(req, res, selectedDestination);
  } catch (error) {
    console.error(error);
    next(
      new SpinderServerError(
        HttpStatusCode.InternalServerError,
        new Error(
          "Failed to refresh destination deck. This is most likely a db write failure."
        )
      )
    );
  }
}

async function saveDeckItemToDestination(
  req: Request,
  res: Response,
  next: (error: SpinderServerError) => void
) {
  const userId: string = req.cookies.userId || null;
  const accessToken: string = req.cookies.spinder_spotify_access_token || "";
  const destination = req.query.destination || null;
  const item = req.query.item || null;
  try {
    if (!destination || !item) throw new Error("Invalid destination or item."); //Replace with more sophisticated validation.
    const selectedDestination: DiscoverDestination = safeParseJson(
      destination as string
    ); //as sring should no longer be needed if destination is properly validated.
    const deckItem: DeckItem = safeParseJson(item as string);
    if (selectedDestination.isFavourites) {
      addTracksToSpotifyUserSavedItems(accessToken, [deckItem.trackId]); //We may want to consider awaiting these for better response accuracy.
    } else {
      addTracksToSpotifyUserPlaylist(accessToken, selectedDestination.id, [
        deckItem.trackUri,
      ]);
    }
    setFirestoreDoc(`users/${userId}/destinationDeck/${deckItem.trackId}`, {}); //Completely cosmetic. The frontend uses predictive logic for the like feature and refreshes on page reload which renders this essentially pointless.
    okResponse(req, res, "saved");
  } catch (error) {
    console.error(error);
    next(
      new SpinderServerError(
        HttpStatusCode.InternalServerError,
        new Error(
          "Failed to save item. This is most likely a Spotify call failure."
        )
      )
    );
  }
}

async function removeDeckItemFromDestination(
  req: Request,
  res: Response,
  next: (error: SpinderServerError) => void
) {
  const userId: string = req.cookies.userId || null;
  const accessToken: string = req.cookies.spinder_spotify_access_token || "";
  const destination = req.query.destination || null;
  const item = req.query.item || null;
  try {
    if (!destination || !item) throw new Error("Invalid destination or item."); //Replace with more sophisticated validation.
    const selectedDestination: DiscoverDestination = safeParseJson(
      destination as string
    ); //as sring should no longer be needed if destination is properly validated.
    const deckItem: DeckItem = safeParseJson(item as string);
    if (selectedDestination.isFavourites) {
      removeTracksFromSpotifyUserSavedItems(accessToken, [deckItem.trackId]); //We may want to consider awaiting these for better response accuracy.
    } else {
      removeTracksFromSpotifyUserPlaylist(accessToken, selectedDestination.id, [
        deckItem.trackUri,
      ]);
    }
    deleteFirestoreDoc(`users/${userId}/destinationDeck/${deckItem.trackId}`); //Completely cosmetic. The frontend uses predictive logic for the like feature and refreshes on page reload which renders this essentially pointless.
    okResponse(req, res, "removed");
  } catch (error) {
    console.error(error);
    next(
      new SpinderServerError(
        HttpStatusCode.InternalServerError,
        new Error(
          "Failed to unsave item. This is most likely a Spotify call failure."
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
  refreshSourceDeck,
  refreshDestinationDeck,
  saveDeckItemToDestination,
  removeDeckItemFromDestination,
};
