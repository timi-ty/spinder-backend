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

//TODO: console.log every error that you catch in a try/catch block and forward just a descriptive string message of the error source to the error handler middleware.

env.config();

const app = express();
app.use(
  cors({
    origin: new RegExp(`^${process.env.FRONTEND_ROOT}`),
    credentials: true,
  }),
  cookieParser(),
  bodyParser.urlencoded({ extended: false })
);

/**********Firebase Start**********/
startFirebaseApp();
/**********Firebase End************/

app.use(interceptRequestMismatch);

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
