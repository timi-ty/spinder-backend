import { Request, Response } from "express";
import { SpinderError, okResponse } from "../utils/utils.js";
import { DiscoverDestination, DiscoverSourceData } from "./discover.model.js";
import { HttpStatusCode } from "axios";
import {
  updateOrCreateSpinderUserData,
  setSpinderUserData,
} from "../user/user.utils.js";
import { getCountOrAllOwnedSpotifyPlaylists } from "./discover.util.js";
import {
  setFirestoreDoc,
  updateFirestoreDoc,
} from "../firebase/firebase.spinder.js";

//Get the list of currently allowed discover destinations. The user's destination selection should be marked in the response.
async function getDiscoverDestinations(
  req: Request,
  res: Response,
  next: (error: SpinderError) => void
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
      new SpinderError(
        HttpStatusCode.InternalServerError,
        new Error(
          "Failed to assemble reponse. This is most likely a spotify query failure."
        )
      )
    );
  }
}

//Search the list of currently allowed discover destinations.
async function searchDiscoverDestinations(
  req: Request,
  res: Response,
  next: (error: SpinderError) => void
) {}

async function setDiscoverDestination(
  req: Request,
  res: Response,
  next: (error: SpinderError) => void
) {
  const destinationId = req.query.destinationId || null;
  const userId = req.cookies.userId || null;
  const data = { selectedDiscoverDestination: destinationId };
  try {
    if (!destinationId) throw new Error("Invalid destinationId."); //Replace with more sophisticated validation.
    await updateFirestoreDoc(`users/${userId}`, data);
    const response: DiscoverDestination = {
      name: "",
      image: "",
      id: destinationId as string, //This hack should become unecessary if destinationId is properly validated.
    };
    okResponse(req, res, response);
  } catch (error) {
    console.error(error);
    next(
      new SpinderError(
        HttpStatusCode.InternalServerError,
        new Error(
          "Failed to set desinationId. This is most likely a db write failure."
        )
      )
    );
  }
}

//Get the list of currently allowed discover source types from the Spinder App Database. The user's source type selection should be marked in the response.
async function getDiscoverSourceTypes(
  req: Request,
  res: Response,
  next: (error: SpinderError) => void
) {
  try {
    const accessToken = req.cookies.spinder_spotify_access_token || null;
    const userId = req.cookies.userId || null;
    const userData = await updateOrCreateSpinderUserData(userId, accessToken);
    var discoverSourceTypesData: DiscoverSourceData = {
      selectedSource: userData.selectedDiscoverSource,
      availableSources: [
        "Anything Me",
        "Following",
        "Playlist",
        "Artiste",
        "Keyword",
      ],
    };
    okResponse(req, res, discoverSourceTypesData);
  } catch (error) {
    console.error(error);
    next(
      new SpinderError(
        HttpStatusCode.InternalServerError,
        new Error(
          "Failed to assemble reponse. This is most likely a db query failure."
        )
      )
    );
  }
}

//Using source type, search spotify for matching discover sources.
async function searchDiscoverSources(
  req: Request,
  res: Response,
  next: (error: SpinderError) => void
) {}

export {
  getDiscoverSourceTypes,
  searchDiscoverSources,
  getDiscoverDestinations,
  searchDiscoverDestinations,
  setDiscoverDestination,
};
