import { Express, Router } from "express";
import {
  authErrorHandler,
  authRequestLogger,
  ensureFirebaseAuthenticatedUser,
  ensureSpotifyAccessToken,
} from "../auth/auth.middleware.js";
import { renewAuthentication } from "./auth.controller.js";

var authRouter: Router;

function assembleAuthRouter(router: Router) {
  authRouter = router;

  //Print auth requests to the console.
  authRouter.use(authRequestLogger);

  //These middlewares combine to achieve the goal of the renew endpoint.
  authRouter.use(ensureSpotifyAccessToken(true)); //This forces a newly gotten spotify access token on the client.
  authRouter.use(ensureFirebaseAuthenticatedUser); //This ensures that the user is correctly authenticated with firebase. We could choose to check that the auth time is recent, but not doing that for now.
  authRouter.get("/renew", renewAuthentication);
  //If more endpoints are to be added that don't play well with these middlewares, this router will need to be restructured.

  //Handle auth errors.
  authRouter.use(authErrorHandler);
}

function addAuthRouter(app: Express) {
  if (!authRouter) {
    throw Error("Auth router must be assembled before being added.");
  }

  app.use("/api/auth", authRouter);
}

export { assembleAuthRouter, addAuthRouter };
