import { HttpStatusCode } from "axios";
import { Request, Response } from "express";
import { appLogger } from "./logger.js";

const fiveMinutesInMillis = 300000; //5 minutes in millis
const oneYearInMillis = 31536000000; //1 year in millis

class SpinderError {
  status: number;
  error: Error;

  constructor(status: number, error: Error) {
    this.status = status;
    this.error = error;
  }
}

class SpinderClientError {
  status: number;
  message: string;

  constructor(error: SpinderError) {
    this.status = error.status;
    this.message = error.error.message;
  }
}

interface SpotifyErrorResponse {
  error: SpinderClientError;
}

function okResponse(req: Request, res: Response, responseData: any) {
  appLogger.debug(
    `Responding to request at ${req.originalUrl} with: ${JSON.stringify(
      responseData
    )}`
  );
  res.status(HttpStatusCode.Ok).json(responseData);
}

function okRedirect(req: Request, res: Response, redirectUrl: string) {
  appLogger.debug(
    `Responding to request at ${req.originalUrl} with a redirect to: ${redirectUrl}`
  );
  res.status(HttpStatusCode.SeeOther).redirect(redirectUrl);
}

export {
  fiveMinutesInMillis,
  oneYearInMillis,
  SpinderError,
  SpinderClientError,
  SpotifyErrorResponse,
  okResponse,
  okRedirect,
};
