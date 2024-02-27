import { HttpStatusCode } from "axios";
import { Request, Response } from "express";
import { appLogger } from "./logger.js";

const fiveMinutesInMillis = 300000; //5 minutes in millis
const oneYearInMillis = 31536000000; //1 year in millis

class SpinderServerError {
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

  constructor(error: SpinderServerError) {
    this.status = error.status;
    this.message = error.error.message;
  }
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

//Returns count number of random items from a list. If the list size is less than count, the result size is equal to the list size.
function getRandomItems<T>(list: T[], count: number): T[] {
  const shuffled = list.slice().sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, list.length));
}

function safeParseJson(jsonString: string) {
  return JSON.parse(jsonString, (key, value) => {
    if (typeof value === "string") {
      return value.replace(/\\u[\dA-Fa-f]{4}/g, (match) => {
        // Convert Unicode escape sequences to characters
        return String.fromCharCode(parseInt(match.substr(2), 16));
      });
    }
    return value;
  });
}

export {
  fiveMinutesInMillis,
  oneYearInMillis,
  SpinderServerError,
  SpinderClientError,
  okResponse,
  okRedirect,
  getRandomItems,
  safeParseJson,
};
