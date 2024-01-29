import express, { Request, Response } from "express";
import env from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { HttpStatusCode } from "axios";
import { startFirebaseApp } from "./firebase/firebase.spinder.js";
import { addLoginRouter, assembleLoginRouter } from "./login/login.router.js";
import { addUserRouter, assembleUserRouter } from "./user/user.router.js";
import {
  assembleDiscoverRouter,
  addDiscoverRouter,
} from "./discover/discover.router.js";
import { SpinderErrorResponse } from "./utils/utils.js";

//TODO: console.log every error that you catch in a try/catch block and forward just a descriptive string message of the error source to the error handler middleware.

env.config();

const app = express();
app.use(
  cors({
    origin: new RegExp(`^${process.env.FRONTEND_ROOT}`),
    credentials: true,
  }),
  cookieParser()
);

/**********Firebase Start**********/
startFirebaseApp();
/**********Firebase End************/

/**********Login Start**********/
assembleLoginRouter(express.Router());
addLoginRouter(app);
/**********Login End************/

/**********User Start**********/
assembleUserRouter(express.Router());
addUserRouter(app);
/**********User End************/

/**********Discover Start**********/
assembleDiscoverRouter(express.Router());
addDiscoverRouter(app);
/**********Discover End************/

function catchAll(req: Request, res: Response) {
  console.log(
    `Received a request to an undefined endpoint at ${req.originalUrl}.`
  );
  if (req.xhr) {
    // Request made by JavaScript
    console.log(
      "Assuming frontend script made this request. Sending JSON response..."
    );
    res
      .status(HttpStatusCode.NotFound)
      .json(new SpinderErrorResponse("not_an_api", "not_an_api"));
  } else {
    // Request made by entering URL in the browser
    console.log(
      "Assuming the request came from entering the url in the browser. Redirecting..."
    );
    res
      .status(HttpStatusCode.NotFound)
      .redirect(`${process.env.FRONTEND_ROOT}`);
  }
}

app.use(catchAll);

app.listen(process.env.PORT, () => {
  console.log(`Spinder app listening on port ${process.env.PORT}`);
});
