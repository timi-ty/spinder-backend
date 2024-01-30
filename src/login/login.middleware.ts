import { HttpStatusCode } from "axios";
import { Request, Response } from "express";
import { SpinderError } from "../utils/utils.js";

function loginRequestLogger(req: Request, res: Response, next: () => void) {
  console.log(`Recieved a /login ${req.method} request to ${req.url}`);
  next();
}

function loginErrorHandler(error: SpinderError, req: Request, res: Response) {
  console.error(`Login Error at ${req.originalUrl} - ${error.message}.`);

  if (error.status === HttpStatusCode.SeeOther) {
    //This error comes from a redirect and cannot be relayed in JSON. Find another way to communicate this error to the frontend.
    res
      .status(HttpStatusCode.BadRequest)
      .redirect(`${process.env.FRONTEND_ROOT}`);
    return;
  }

  //Send error response to let the frontend know that the login process must be restarted.
  res.status(HttpStatusCode.BadRequest).json(error);
}

export { loginRequestLogger, loginErrorHandler };
