import { Express, Router } from "express";
import {
  discoverErrorHandler,
  discoverRequestLogger,
} from "./discover.middleware.js";
import {
  getDiscoverDestinations,
  getDiscoverSources,
  refillDiscoverSourceDeck,
  removeDeckItemFromDestination,
  resetDiscoverDestinationDeck,
  saveDeckItemToDestination,
  searchDiscoverDestinations,
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

  //All discover endpoints require the user to be firebase authenticated.
  discoverRouter.use(ensureFirebaseAuthenticatedUser);

  discoverRouter.get("/sources", getDiscoverSources);

  discoverRouter.post("/source", setDiscoverSource);

  discoverRouter.get("/sources/search", searchDiscoverSources);

  discoverRouter.get("/deck/source/refill", refillDiscoverSourceDeck);

  //Some discover endpoints require the user to be SPotify authenticated
  discoverRouter.use(ensureSpotifyAccessToken(false));

  discoverRouter.get("/destinations", getDiscoverDestinations);

  discoverRouter.post("/destination", setDiscoverDestination);

  discoverRouter.get("/destinations/search", searchDiscoverDestinations);

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
