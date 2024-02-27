import { Request, Response } from "express";
import { SpinderClientError, SpinderServerError } from "../utils/utils.js";
import { discoverLogger } from "../utils/logger.js";

function discoverRequestLogger(req: Request, res: Response, next: () => void) {
  discoverLogger.debug(
    `Recieved a /discover ${req.method} request to ${req.url}`
  );
  next();
}

function discoverErrorHandler(
  err: SpinderServerError,
  req: Request,
  res: Response,
  next: any
) {
  discoverLogger.error(
    `Origin Url: ${req.originalUrl}, Message: ${err.error.message}`
  );
  discoverLogger.error(err.error.stack);
  res.status(err.status).json(new SpinderClientError(err));
}

export { discoverRequestLogger, discoverErrorHandler };
