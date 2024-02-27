import { Request, Response } from "express";
import { SpinderClientError, SpinderServerError } from "../utils/utils.js";
import { loginLogger } from "../utils/logger.js";

function loginRequestLogger(req: Request, res: Response, next: () => void) {
  loginLogger.debug(`Recieved a /login ${req.method} request to ${req.url}`);
  next();
}

function loginErrorHandler(
  err: SpinderServerError,
  req: Request,
  res: Response,
  next: any
) {
  loginLogger.error(
    `Origin Url: ${req.originalUrl}, Message: ${err.error.message}`
  );
  loginLogger.error(err.error.stack);

  if (!req.xhr) {
    //This request came straight form the browser and should not receive a JSON response. Find another way to communicate this error to the frontend.
    res.status(err.status).redirect(`${process.env.FRONTEND_ROOT}`);
    return;
  }

  //Send error response to let the frontend know that the login process must be restarted.
  res.status(err.status).json(new SpinderClientError(err));
}

export { loginRequestLogger, loginErrorHandler };
