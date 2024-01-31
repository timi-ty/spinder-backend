import express from "express";
import env from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
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

app.use(interceptRequestMismatch);

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

app.use(catchUndefined);
app.use(catchError);

app.listen(process.env.PORT, () => {
  appLogger.info(`Spinder app listening on port ${process.env.PORT}...`);
});
