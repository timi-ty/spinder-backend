import { Express, Router } from "express";
import {
  discoverErrorHandler,
  discoverRequestLogger,
} from "./discover.middleware.js";
import {
  getDiscoverDestinations,
  getDiscoverSourceTypes,
  refillDiscoverSourceDeck,
  removeDeckItemFromDestination,
  resetDiscoverDestinationDeck,
  saveDeckItemToDestination,
  searchDiscoverSources,
  setDiscoverDestination,
  setDiscoverSource,
} from "./discover.controller.js";
import {
  ensureFirebaseAuthenticatedUser,
  ensureSpotifyAccessToken,
} from "../auth/auth.middleware.js";

var discoverRouter: Router;

function assembleDiscoverRouter(router: Router) {
  discoverRouter = router;

  //Print login requests to the console.
  discoverRouter.use(discoverRequestLogger);

  //All discover endpoints require the user to be fully authenticated.
  discoverRouter.use(ensureSpotifyAccessToken(false));
  discoverRouter.use(ensureFirebaseAuthenticatedUser);

  discoverRouter.get("/sources", getDiscoverSourceTypes);

  discoverRouter.post("/source", setDiscoverSource);

  discoverRouter.get("/sources/search", searchDiscoverSources);

  discoverRouter.get("/destinations", getDiscoverDestinations);

  discoverRouter.post("/destination", setDiscoverDestination);

  discoverRouter.get("/deck/source/refill", refillDiscoverSourceDeck);

  discoverRouter.get("/deck/destination/reset", resetDiscoverDestinationDeck);

  discoverRouter.get("/deck/destination/save", saveDeckItemToDestination);

  discoverRouter.get("/deck/destination/remove", removeDeckItemFromDestination);

  //Handle login errors.
  discoverRouter.use(discoverErrorHandler);
}

function addDiscoverRouter(app: Express) {
  if (!discoverRouter) {
    throw Error("Login router must be assembled before being added.");
  }

  app.use("/api/discover", discoverRouter);
}

export { assembleDiscoverRouter, addDiscoverRouter };
