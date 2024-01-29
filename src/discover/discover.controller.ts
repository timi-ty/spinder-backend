import { Request, Response } from "express";
import config from "../config/config.js";
import {
  getFirestoreDocData,
  setFirestoreDocData,
} from "../firebase/firebase.spinder.js";
import { STATUS_OK, SpinderErrorResponse } from "../utils/utils.js";
import {
  DiscoverSourceTypesData,
  DiscoverSourceTypesResponse,
} from "./discover.model.js";
import { SpinderUserData, defaultSpinderUserData } from "../user/user.model.js";
import { ERR_DISCOVER_OTHER_ERROR } from "./discover.middleware.js";
import { HttpStatusCode } from "axios";
import { getOrCreateSpinderUserData } from "../user/user.utils.js";

//Get the list of currently allowed discover destinations. The user's destination selection should be marked in the response.
async function getDiscoverDestinations(
  req: Request,
  res: Response,
  next: (error: SpinderErrorResponse) => void
) {}

//Search the list of currently allowed discover destinations.
async function searchDiscoverDestinations(
  req: Request,
  res: Response,
  next: (error: SpinderErrorResponse) => void
) {}

//Get the list of currently allowed discover source types from the Spinder App Database. The user's source type selection should be marked in the response.
async function getDiscoverSourceTypes(
  req: Request,
  res: Response,
  next: (error: SpinderErrorResponse) => void
) {
  try {
    const spinderUserData = await getOrCreateSpinderUserData(
      req.cookies.userId
    );

    var discoverSourceTypesData: DiscoverSourceTypesData = {
      selectedSourceType: 0,
      sourceTypes: [],
    };

    discoverSourceTypesData.sourceTypes = config.discover_source_types;
    discoverSourceTypesData.selectedSourceType =
      spinderUserData.selectedDiscoverSourceType;
    res
      .status(HttpStatusCode.Ok)
      .json(
        new DiscoverSourceTypesResponse(STATUS_OK, discoverSourceTypesData)
      );
  } catch (error) {
    next(
      new SpinderErrorResponse(
        ERR_DISCOVER_OTHER_ERROR,
        `Failed to assemble reponse. This is most likely a db query failure. ${error}`
      )
    );
  }
}

//Using source type, search spotify for matching discover sources.
async function searchDiscoverSources(
  req: Request,
  res: Response,
  next: (error: SpinderErrorResponse) => void
) {}

export {
  getDiscoverSourceTypes,
  searchDiscoverSources,
  getDiscoverDestinations,
  searchDiscoverDestinations,
};
