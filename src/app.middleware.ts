import { Request, Response } from "express";
import { HttpStatusCode } from "axios";
import { SpinderClientError, SpinderServerError } from "./utils/utils.js";
import { appLogger } from "./utils/logger.js";

//TODO: FInd a better way to identify AJAX requests rather than faking the xhr header.

function interceptRequestMismatch(req: Request, res: Response, next: any) {
  const isBrowserUrl =
    req.originalUrl.endsWith("/api/login") ||
    req.originalUrl.startsWith("/api/login/callback") ||
    req.originalUrl.startsWith("/api/login/request_access");
  //Add more permitted browser urls here.

  if (req.xhr && isBrowserUrl) {
    // AJAX request made to a browser only url.
    next(
      new SpinderServerError(
        HttpStatusCode.BadRequest,
        new Error(
          `Request mismatch. Sent an AJAX request to ${req.originalUrl} but it is a browser only url.`
        )
      )
    );
  } else if (!req.xhr && !isBrowserUrl) {
    // Request made by entering URL in the browser to an AJAX only API endpoint.
    next(
      new SpinderServerError(
        HttpStatusCode.BadRequest,
        new Error(
          `Request mismatch. Entered ${req.originalUrl} in the browser but it is an AJAX only endpoint.`
        )
      )
    );
  } else {
    next();
  }
}

function catchUndefined(req: Request, res: Response) {
  appLogger.warn(
    `Received a request to an undefined endpoint at ${req.originalUrl}.`
  );
  if (req.xhr) {
    // Request made by AJAX, sending JSON not found.
    appLogger.warn("Assuming AJAX made this request. Sending JSON response...");
    res
      .status(HttpStatusCode.NotFound)
      .json(
        new SpinderClientError(
          new SpinderServerError(
            HttpStatusCode.NotFound,
            new Error(`${req.originalUrl} is not an api endpoint.`)
          )
        )
      );
  } else {
    // Request made by entering URL in the browser, sending browser not found.
    appLogger.warn(
      "Assuming the request came from entering the url in the browser. Redirecting..."
    );
    res
      .status(HttpStatusCode.NotFound)
      .redirect(`${process.env.FRONTEND_ROOT}`);
  }
}

function catchError(
  err: SpinderServerError,
  req: Request,
  res: Response,
  next: any
) {
  appLogger.error(
    `Origin Url: ${req.originalUrl}, Message: ${err.error.message}`
  );
  appLogger.error(err.error.stack);
  if (req.xhr) {
    // Request made by AJAX, sending JSON error.
    res.status(err.status).json(new SpinderClientError(err));
  } else {
    // Request made by entering URL in the browser, sending browser error.
    res.status(err.status).redirect(`${process.env.FRONTEND_ROOT}`);
  }
}

export { interceptRequestMismatch, catchUndefined, catchError };
