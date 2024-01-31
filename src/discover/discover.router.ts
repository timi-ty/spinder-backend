import { Express, Router } from "express";
import {
  discoverErrorHandler,
  discoverRequestLogger,
} from "./discover.middleware.js";
import {
  getDiscoverDestinations,
  getDiscoverSourceTypes,
} from "./discover.controller.js";
import { ensureFirebaseAuthenticatedUser } from "../auth/auth.middleware.js";

var discoverRouter: Router;

function assembleDiscoverRouter(router: Router) {
  discoverRouter = router;

  //Print login requests to the console.
  discoverRouter.use(discoverRequestLogger);

  //All discover endpoints require the user to be fully authenticated.
  discoverRouter.use(ensureFirebaseAuthenticatedUser);

  discoverRouter.get("/source-types", getDiscoverSourceTypes);

  discoverRouter.get("/destinations", getDiscoverDestinations);

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
