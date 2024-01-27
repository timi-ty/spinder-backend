import { Express, Router } from "express";
import { returnSpotifyUserData } from "./user.controller.js";
import { userErrorHandler, userRequestLogger } from "./user.middleware.js";

var userRouter: Router;

function assembleUserRouter(router: Router) {
  userRouter = router;

  //Print user requests to the console.
  userRouter.use(userRequestLogger);

  userRouter.get("/spotify", returnSpotifyUserData);

  //Handle uer errors.
  userRouter.use(userErrorHandler);
}

function addUserRouter(app: Express) {
  if (!userRouter) {
    throw Error("User router must be assembled before being added.");
  }

  app.use("/api/user", userRouter);
}

export { assembleUserRouter, addUserRouter };
