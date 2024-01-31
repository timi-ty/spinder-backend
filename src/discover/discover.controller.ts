import { Request, Response } from "express";
import { SpinderError, okResponse } from "../utils/utils.js";
import { DiscoverSourceTypesData } from "./discover.model.js";
import { HttpStatusCode } from "axios";
import { getOrCreateSpinderUserData } from "../user/user.utils.js";
import { discoverLogger } from "../utils/logger.js";

//Get the list of currently allowed discover destinations. The user's destination selection should be marked in the response.
async function getDiscoverDestinations(
  req: Request,
  res: Response,
  next: (error: SpinderError) => void
) {}

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
    const spinderUserData = await getOrCreateSpinderUserData(
      req.cookies.userId
    );

    var discoverSourceTypesData: DiscoverSourceTypesData = {
      selectedSourceType: spinderUserData.selectedDiscoverSourceType,
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
    discoverLogger.error(error);
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
};
