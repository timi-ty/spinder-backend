import { Request, Response } from "express";
import { SpinderError } from "../utils/utils.js";

function discoverRequestLogger(req: Request, res: Response, next: () => void) {
  console.log(`Recieved a /discover ${req.method} request to ${req.url}`);
  next();
}

function discoverErrorHandler(
  error: SpinderError,
  req: Request,
  res: Response
) {
  console.log(`Discover Error at ${req.originalUrl} - ${error.message}.`);
  res.status(error.status).json(error);
}

export { discoverRequestLogger, discoverErrorHandler };
