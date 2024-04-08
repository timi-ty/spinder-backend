import express from "express";
import env from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import { startFirebaseApp } from "./firebase/firebase.spinder.js";
import { addLoginRouter, assembleLoginRouter } from "./login/login.router.js";
import { addUserRouter, assembleUserRouter } from "./user/user.router.js";
import {
  assembleDiscoverRouter,
  addDiscoverRouter,
} from "./discover/discover.router.js";
import {
  catchError,
  catchUndefined,
  interceptRequestMismatch,
} from "./app.middleware.js";
import { appLogger } from "./utils/logger.js";
import { startDeckService } from "./services/deck.service.js";
import { addAuthRouter, assembleAuthRouter } from "./auth/auth.router.js";
import { slowDown } from "express-slow-down";

//TODO: console.log every error that you catch in a try/catch block and forward just a descriptive string message of the error source to the error handler middleware.

env.config();
const limiter = slowDown({
  windowMs: 1 * 60 * 1000, // 1 minute
  delayAfter: 50, // Allow 5 requests per 15 minutes.
  delayMs: (hits) => hits * 100, // Add 100 ms of delay to every request after the 5th one.

  /**
   * So:
   *
   * - requests 1-5 are not delayed.
   * - request 6 is delayed by 600ms
   * - request 7 is delayed by 700ms
   * - request 8 is delayed by 800ms
   *
   * and so on. After 15 minutes, the delay is reset to 0.
   */
});

const app = express();
app.use(
  cors({
    origin: new RegExp(`^${process.env.FRONTEND_ROOT}`),
    credentials: true,
  }),
  cookieParser(),
  bodyParser.urlencoded({ extended: false }),
  interceptRequestMismatch,
  limiter
);

/**********Firebase Start**********/
startFirebaseApp();
/**********Firebase End************/

/**********Login Start**********/
assembleLoginRouter(express.Router());
addLoginRouter(app);
/**********Login End************/

/**********Auth Start**********/
assembleAuthRouter(express.Router());
addAuthRouter(app);
/**********Auth End************/

/**********User Start**********/
assembleUserRouter(express.Router());
addUserRouter(app);
/**********User End************/

/**********Discover Start**********/
assembleDiscoverRouter(express.Router());
addDiscoverRouter(app);
/**********Discover End************/

startDeckService();

app.use(catchUndefined);
app.use(catchError);

const port = +(process.env.PORT || 3000) + 1;
app.listen(port, () => {
  appLogger.info(`Spinder app listening on port ${port}...`);
});
