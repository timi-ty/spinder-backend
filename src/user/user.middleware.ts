import { Request, Response } from "express";
import { HttpStatusCode } from "axios";
import { SpinderErrorResponse } from "../utils/utils.js";

function userRequestLogger(req: Request, res: Response, next: () => void) {
  console.log(`Recieved a /user ${req.method} request to ${req.url}`);
  next();
}

const ERR_USER_OTHER_ERROR = "user_other_error"; //Failed to send custom sign in token.

function userErrorHandler(
  err: SpinderErrorResponse,
  req: Request,
  res: Response,
  next: (err: Error) => void
) {
  console.log(`User Error - ${JSON.stringify(err)}.`);
  next(err.error());
  res.status(HttpStatusCode.InternalServerError).json(err);
}

export { userRequestLogger, ERR_USER_OTHER_ERROR, userErrorHandler };
