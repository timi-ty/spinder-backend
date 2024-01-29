import { HttpStatusCode } from "axios";
import { SpinderErrorResponse } from "../utils/utils.js";
import { Request, Response } from "express";

function discoverRequestLogger(req: Request, res: Response, next: () => void) {
  console.log(`Recieved a /discover ${req.method} request to ${req.url}`);
  next();
}

const ERR_DISCOVER_OTHER_ERROR = "discover_other_error";

function discoverErrorHandler(
  err: SpinderErrorResponse,
  req: Request,
  res: Response,
  next: (err: Error) => void
) {
  console.log(`Discover Error - ${JSON.stringify(err)}.`);
  next(err.error());
  res.status(HttpStatusCode.InternalServerError).json(err);
}

export {
  discoverRequestLogger,
  ERR_DISCOVER_OTHER_ERROR,
  discoverErrorHandler,
};
