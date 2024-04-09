import { Request, Response } from "express";
import {
  SpinderServerError,
  okResponse,
  safeParseJson,
} from "../utils/utils.js";
import {
  DiscoverDestination,
  DiscoverDestinationSearchResult,
  DiscoverSource,
  DiscoverSourceData,
  DiscoverSourceSearchResult,
} from "./discover.model.js";
import { HttpStatusCode } from "axios";
import {
  getAuthOrAnonAccessToken,
  getSpinderUserData,
  isAnonUser,
} from "../user/user.utils.js";
import {
  filterOwnedSpotifyPlaylistsToDiscoverDestinations,
  getCountOrAllOwnedSpotifyPlaylistsAsDiscoverDestinations,
} from "./discover.util.js";
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
  resetDestinationDeck,
  refillSourceDeck,
  resetSourceDeck,
} from "../services/deck.service.js";
import { DeckItem } from "../services/deck.model.js";
import { SpinderUserData } from "../user/user.model.js";
import { getAdminAccessToken } from "../services/admin.service.js";

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
    const userData = await getSpinderUserData(userId);
    discoverDestinations.selectedDestination =
      userData.selectedDiscoverDestination;
    //Add favourites as the first destination
    const destinationFavourites: DiscoverDestination = {
      name: "Favourites",
      image: "/resources/ic_favourites_heart.svg", //TODO: look into hosting app level images on firebase storage
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
    resetDestinationDeck(userId, accessToken, discoverDestination);
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

//Get the selected source and all the currently allowed composite sources. Other sources can be searched for.
async function getDiscoverSources(
  req: Request,
  res: Response,
  next: (error: SpinderServerError) => void
) {
  try {
    const userId: string = req.cookies.userId || null;
    const userData = await getSpinderUserData(userId);
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
          type: "Spindr People",
          id: "spindrpeople",
          name: "Spindr People",
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
    const accessToken: string = await getAuthOrAnonAccessToken(req);

    const spotifySearchResult = await searchSpotify(
      accessToken,
      q as string,
      false
    );
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
        type: "Spindr Person",
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

async function searchDiscoverDestinations(
  req: Request,
  res: Response,
  next: (error: SpinderServerError) => void
) {
  try {
    const q = req.query.q || "";
    const accessToken: string = req.cookies.spinder_spotify_access_token || "";
    const userId: string = req.cookies.userId || null;

    const spotifySearchResult = await searchSpotify(
      accessToken,
      q as string,
      false
    );
    const playlistDestinations =
      filterOwnedSpotifyPlaylistsToDiscoverDestinations(
        spotifySearchResult.playlists,
        userId
      );
    const searchResult: DiscoverDestinationSearchResult = {
      searchText: q as string,
      playlists: playlistDestinations,
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
  const accessToken: string = await getAuthOrAnonAccessToken(req);
  const source = req.query.source || null;
  try {
    if (!source) throw new Error("Invalid source."); //Replace with more sophisticated validation.
    const selectedSource: DiscoverSource = safeParseJson(source as string); //as sring should no longer be needed if source is properly validated.
    await updateFirestoreDoc(`users/${userId}`, {
      selectedDiscoverSource: selectedSource,
    });
    resetSourceDeck(userId, accessToken, selectedSource); //Dispatches and responds immediately. The frontend listens to the source deck filling up.
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

async function refillDiscoverSourceDeck(
  req: Request,
  res: Response,
  next: (error: SpinderServerError) => void
) {
  const userId: string = req.cookies.userId || null;
  const accessToken: string = await getAuthOrAnonAccessToken(req);
  try {
    const selectedSource = (await getSpinderUserData(userId))
      .selectedDiscoverSource;
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

async function resetDiscoverDestinationDeck(
  req: Request,
  res: Response,
  next: (error: SpinderServerError) => void
) {
  const userId: string = req.cookies.userId || null;
  const accessToken: string = req.cookies.spinder_spotify_access_token || "";

  try {
    const selectedDestination = (await getSpinderUserData(userId))
      .selectedDiscoverDestination;
    resetDestinationDeck(userId, accessToken, selectedDestination); //Dispatches and responds immediately. The frontend listens to the source deck filling up.
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
  const item = req.query.item || null;
  try {
    if (!item) throw new Error("Invalid item."); //Replace with more sophisticated validation.
    const deckItem: DeckItem = safeParseJson(item as string);
    const selectedDestination = (await getSpinderUserData(userId))
      .selectedDiscoverDestination;
    if (selectedDestination.isFavourites) {
      addTracksToSpotifyUserSavedItems(accessToken, [deckItem.trackId]); //We may want to consider awaiting these for better response accuracy.
    } else {
      addTracksToSpotifyUserPlaylist(accessToken, selectedDestination.id, [
        deckItem.trackUri,
      ]);
    }
    setFirestoreDoc(`users/${userId}/destinationDeck/${deckItem.trackId}`, {});
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
  const item = req.query.item || null;
  try {
    if (!item) throw new Error("Invalid item."); //Replace with more sophisticated validation.
    const selectedDestination = (await getSpinderUserData(userId))
      .selectedDiscoverDestination;
    const deckItem: DeckItem = safeParseJson(item as string);
    if (selectedDestination.isFavourites) {
      removeTracksFromSpotifyUserSavedItems(accessToken, [deckItem.trackId]); //We may want to consider awaiting these for better response accuracy.
    } else {
      removeTracksFromSpotifyUserPlaylist(accessToken, selectedDestination.id, [
        deckItem.trackUri,
      ]);
    }
    deleteFirestoreDoc(`users/${userId}/destinationDeck/${deckItem.trackId}`);
    okResponse(req, res, "removed");
  } catch (error) {
    console.error(error);
    next(
      new SpinderServerError(
        HttpStatusCode.InternalServerError,
        new Error(
          "Failed to remove item. This is most likely a Spotify call failure."
        )
      )
    );
  }
}

export {
  getDiscoverSources,
  searchDiscoverSources,
  setDiscoverSource,
  getDiscoverDestinations,
  searchDiscoverDestinations,
  setDiscoverDestination,
  refillDiscoverSourceDeck,
  resetDiscoverDestinationDeck,
  saveDeckItemToDestination,
  removeDeckItemFromDestination,
};
