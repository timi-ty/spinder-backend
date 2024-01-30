import { Request, Response } from "express";
import { SpinderError } from "../utils/utils.js";

function userRequestLogger(req: Request, res: Response, next: () => void) {
  console.log(`Recieved a /user ${req.method} request to ${req.url}`);
  next();
}

function userErrorHandler(error: SpinderError, req: Request, res: Response) {
  console.error(`User Error at ${req.originalUrl} - ${error.message}.`);
  res.status(error.status).json(error);
}

export { userRequestLogger, userErrorHandler };
