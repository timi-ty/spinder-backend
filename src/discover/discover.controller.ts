import { Request, Response } from "express";
import { SpinderError, okResponse } from "../utils/utils.js";
import { DiscoverSourceTypesData } from "./discover.model.js";
import { HttpStatusCode } from "axios";
import {
  updateOrCreateSpinderUserData,
  setSpinderUserData,
} from "../user/user.utils.js";
import { discoverLogger } from "../utils/logger.js";
import { getCountOrAllOwnedSpotifyPlaylists } from "./discover.util.js";

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
      userData.selectedDiscoverDestination === "" &&
      discoverDestinations.discoverDestinationPlaylists.length > 0
    ) {
      userData.selectedDiscoverDestination =
        discoverDestinations.discoverDestinationPlaylists[0].id;
      await setSpinderUserData(userId, userData);
    }
    discoverDestinations.selectedDestinationId =
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
    var discoverSourceTypesData: DiscoverSourceTypesData = {
      selectedSourceType: userData.selectedDiscoverSourceType,
      sourceTypes: [
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

async function getDiscoverStack(
  req: Request,
  res: Response,
  next: (error: SpinderError) => void
) {}

export {
  getDiscoverSourceTypes,
  searchDiscoverSources,
  getDiscoverDestinations,
  searchDiscoverDestinations,
};
