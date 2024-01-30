import { Request, Response } from "express";
import { SpinderError } from "../utils/utils.js";

function userRequestLogger(req: Request, res: Response, next: () => void) {
  console.log(`Recieved a /user ${req.method} request to ${req.url}`);
  next();
}

function userErrorHandler(
  err: SpinderError,
  req: Request,
  res: Response,
  next: any
) {
  console.error(`User Error at ${req.originalUrl} - ${err.message}.`);
  res.status(err.status).json(err);
}

export { userRequestLogger, userErrorHandler };
