import express, { Request, Response } from "express";
import env from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { addLoginRouter, assembleLoginRouter } from "./login/login.router.js";
import { addUserRouter, assembleUserRouter } from "./user/user.router.js";
import { HttpStatusCode } from "axios";
import { SpinderErrorResponse } from "./utils/utils.js";
import { startFirebaseApp } from "./firebase/firebase.spinder.js";

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

function catchAll(req: Request, res: Response) {
  console.log(
    `Received a request to an undefined endpoint at ${req.originalUrl}.`
  );
  res
    .status(HttpStatusCode.NotFound)
    .json(new SpinderErrorResponse("not_an_api", "not_an_api"));
}

app.use(catchAll);

app.listen(process.env.PORT, () => {
  console.log(`Spinder app listening on port ${process.env.PORT}`);
});
