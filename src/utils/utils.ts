import { HttpStatusCode } from "axios";
import { Request, Response } from "express";

const fiveMinutesInMillis = 300000; //5 minutes in millis
const oneYearInMillis = 31536000000; //1 year in millis

class SpinderError {
  status: number;
  message: string;

  constructor(status: number, message: string) {
    this.status = status;
    this.message = message;
  }
}

interface SpotifyErrorResponse {
  error: SpinderError;
}

function okResponse(req: Request, res: Response, responseData: any) {
  console.log(
    `Responding to request at ${req.originalUrl} with: ${JSON.stringify(
      responseData
    )}`
  );
  res.status(HttpStatusCode.Ok).json(responseData);
}

function okRedirect(req: Request, res: Response, redirectUrl: string) {
  console.log(
    `Responding to request at ${req.originalUrl} with a redirect to: ${redirectUrl}`
  );
  res.status(HttpStatusCode.SeeOther).redirect(redirectUrl);
}

export {
  fiveMinutesInMillis,
  oneYearInMillis,
  SpinderError,
  SpotifyErrorResponse,
  okResponse,
  okRedirect,
};
