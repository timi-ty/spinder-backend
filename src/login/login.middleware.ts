import { HttpStatusCode } from "axios";
import { Request, Response } from "express";
import { SpinderErrorResponse } from "../utils/utils.js";

function loginRequestLogger(req: Request, res: Response, next: () => void) {
  console.log(`Recieved a /login ${req.method} request to ${req.url}`);
  next();
}

const ERR_LOGIN_ACCESS_DENIED = "login_access_denied"; //Spotify login access denied.
const ERR_LOGIN_FINALIZE_DENIED = "login_finalize_denied"; //Failed to send custom sign in token.
const ERR_LOGIN_OTHER_ERROR = "login_other_error"; //Failed to send custom sign in token.

function loginErrorHandler(
  err: SpinderErrorResponse,
  req: Request,
  res: Response,
  next: (error: Error) => void
) {
  switch (err.code) {
    case ERR_LOGIN_ACCESS_DENIED:
      //Tell the user that they have to sign in with Spotify to use spinder.
      console.log(`Login Error - ${JSON.stringify(err)}. User denied acess.`);
      res
        .status(HttpStatusCode.BadRequest)
        .redirect(`${process.env.FRONTEND_ROOT}`);
      break;
    case ERR_LOGIN_FINALIZE_DENIED:
      //Send error response to let the frontend know that the login process must be restarted.
      console.log(
        `Login Error - ${JSON.stringify(err)}. Failed to finalize login.`
      );
      res.status(HttpStatusCode.BadRequest).json(err);
      break;
    default:
      console.log(`Login Error - ${JSON.stringify(err)}.`);
      next(err.error());
      res
        .status(HttpStatusCode.InternalServerError)
        .redirect(`${process.env.FRONTEND_ROOT}`);
      break;
  }
}

export {
  loginRequestLogger,
  ERR_LOGIN_ACCESS_DENIED,
  ERR_LOGIN_FINALIZE_DENIED,
  ERR_LOGIN_OTHER_ERROR,
  loginErrorHandler,
};
