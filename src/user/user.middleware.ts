import { Request, Response } from "express";
import { HttpStatusCode } from "axios";
import { SpinderErrorResponse } from "../utils/utils.js";

export function userRequestLogger(
  req: Request,
  res: Response,
  next: () => void
) {
  console.log(`Recieved a /user ${req.method} request to ${req.url}`);
  next();
}

export const ERR_USER_OTHER_ERROR = "user_other_error"; //Failed to send custom sign in token.

export function userErrorHandler(
  err: SpinderErrorResponse,
  req: Request,
  res: Response,
  next: (err: Error) => void
) {
  console.log(`User Error - ${JSON.stringify(err)}.`);
  next(err.error());
  res.status(HttpStatusCode.InternalServerError).json(err);
}
