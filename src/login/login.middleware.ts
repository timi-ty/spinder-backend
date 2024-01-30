import { HttpStatusCode } from "axios";
import { Request, Response } from "express";
import { SpinderError } from "../utils/utils.js";

function loginRequestLogger(req: Request, res: Response, next: () => void) {
  console.log(`Recieved a /login ${req.method} request to ${req.url}`);
  next();
}

function loginErrorHandler(
  err: SpinderError,
  req: Request,
  res: Response,
  next: any
) {
  console.error(`Login Error at ${req.originalUrl} - ${err.message}.`);

  if (!req.xhr) {
    //This request came straight form the browser and should not receive a JSON response. Find another way to communicate this error to the frontend.
    res.status(err.status).redirect(`${process.env.FRONTEND_ROOT}`);
    return;
  }

  //Send error response to let the frontend know that the login process must be restarted.
  res.status(err.status).json(err);
}

export { loginRequestLogger, loginErrorHandler };
