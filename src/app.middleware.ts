import { Request, Response } from "express";
import { HttpStatusCode } from "axios";
import { SpinderError } from "./utils/utils.js";

//TODO: FInd a better way to identify AJAX requests rather than faking the xhr header.

function interceptRequestMismatch(req: Request, res: Response, next: any) {
  const isBrowserUrl =
    req.originalUrl.endsWith("/api/login") ||
    req.originalUrl.startsWith("/api/login/callback");
  //Add more permitted browser urls here.

  if (req.xhr && isBrowserUrl) {
    // AJAX request made to a browser only url.
    next(
      new SpinderError(
        HttpStatusCode.BadRequest,
        `Request mismatch. Sent an AJAX request to ${req.originalUrl} but it is a browser only url.`
      )
    );
  } else if (!req.xhr && !isBrowserUrl) {
    // Request made by entering URL in the browser to an AJAX only API endpoint.
    next(
      new SpinderError(
        HttpStatusCode.BadRequest,
        `Request mismatch. Entered ${req.originalUrl} in the browser but it is an AJAX only endpoint.`
      )
    );
  } else {
    next();
  }
}

function catchUndefined(req: Request, res: Response) {
  console.log(
    `Received a request to an undefined endpoint at ${req.originalUrl}.`
  );
  if (req.xhr) {
    // Request made by AJAX, sending JSON not found.
    console.log("Assuming AJAX made this request. Sending JSON response...");
    res
      .status(HttpStatusCode.NotFound)
      .json(
        new SpinderError(
          HttpStatusCode.NotFound,
          `${req.originalUrl} is not an api endpoint.`
        )
      );
  } else {
    // Request made by entering URL in the browser, sending browser not found.
    console.log(
      "Assuming the request came from entering the url in the browser. Redirecting..."
    );
    res
      .status(HttpStatusCode.NotFound)
      .redirect(`${process.env.FRONTEND_ROOT}`);
  }
}

function catchError(err: SpinderError, req: Request, res: Response, next: any) {
  console.error(`App error at ${req.originalUrl} - ${err.message}`);
  if (req.xhr) {
    // Request made by AJAX, sending JSON error.
    res.status(err.status).json(err);
  } else {
    // Request made by entering URL in the browser, sending browser error.
    res.status(err.status).redirect(`${process.env.FRONTEND_ROOT}`);
  }
}

export { interceptRequestMismatch, catchUndefined, catchError };
