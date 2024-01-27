import { Express, Router } from "express";
import {
  finalizeLogin,
  finishLoginWithSpotify,
  startLoginWithSpotify,
} from "./login.controller.js";
import { loginErrorHandler, loginRequestLogger } from "./login.middleware.js";

var loginRouter: Router;

function assembleLoginRouter(router: Router) {
  loginRouter = router;

  //Print login requests to the console.
  loginRouter.use(loginRequestLogger);

  loginRouter.get("/", startLoginWithSpotify);

  //Callback touched by Spotify to complete auth flow.
  loginRouter.get("/callback", finishLoginWithSpotify);

  //The response of this request marks the completion of the login process.
  loginRouter.get("/finalize", finalizeLogin);

  //Handle login errors.
  loginRouter.use(loginErrorHandler);
}

function addLoginRouter(app: Express) {
  if (!loginRouter) {
    throw Error("Login router must be assembled before being added.");
  }

  app.use("/api/login", loginRouter);
}

export { assembleLoginRouter, addLoginRouter };
