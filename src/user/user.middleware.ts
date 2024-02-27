import { Request, Response } from "express";
import { SpinderClientError, SpinderServerError } from "../utils/utils.js";
import { userLogger } from "../utils/logger.js";

function userRequestLogger(req: Request, res: Response, next: () => void) {
  userLogger.debug(`Recieved a /user ${req.method} request to ${req.url}`);
  next();
}

function userErrorHandler(
  err: SpinderServerError,
  req: Request,
  res: Response,
  next: any
) {
  userLogger.error(
    `Origin Url: ${req.originalUrl}, Message: ${err.error.message}`
  );
  userLogger.error(err.error.stack);
  res.status(err.status).json(new SpinderClientError(err));
}

export { userRequestLogger, userErrorHandler };
