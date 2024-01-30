import { Request, Response } from "express";
import { SpinderError } from "../utils/utils.js";

function discoverRequestLogger(req: Request, res: Response, next: () => void) {
  console.log(`Recieved a /discover ${req.method} request to ${req.url}`);
  next();
}

function discoverErrorHandler(
  err: SpinderError,
  req: Request,
  res: Response,
  next: any
) {
  console.error(`Discover Error at ${req.originalUrl} - ${err.message}.`);
  res.status(err.status).json(err);
}

export { discoverRequestLogger, discoverErrorHandler };
