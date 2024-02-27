import { Request, Response } from "express";
import { RenewedAuthData } from "./auth.model.js";
import { okResponse } from "../utils/utils.js";

async function renewAuthentication(req: Request, res: Response) {
  //If no middlewares blocked the request from reaching this point then everything is ok. Respond accordingly.
  const renewAuthResponse: RenewedAuthData = {
    userId: req.cookies.userId,
    spotifyAccessTokenExpiresIn:
      req.cookies.spinder_spotify_access_token_expiry,
    firebaseIdTokenExpiresIn: req.cookies.firebase_token_expiry,
  };

  okResponse(req, res, renewAuthResponse);
}

export { renewAuthentication };
