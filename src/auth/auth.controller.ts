import { Request, Response } from "express";
import { RenewedAuth } from "./auth.model.js";
import { okResponse } from "../utils/utils.js";

async function renewAuthentication(req: Request, res: Response) {
  //If no middlewares blocked the request from reaching this point then everything is ok. Respond accordingly.
  const renewAuthResponse: RenewedAuth = {
    userId: req.cookies.userId,
    spotifyAccessToken: req.cookies.spinder_spotify_access_token,
    spotifyAccessTokenExpiresIn:
      req.cookies.spinder_spotify_access_token_expiry,
    firebaseIdToken: req.cookies.firebase_token,
    firebaseIdTokenExpiresIn: req.cookies.firebase_token_expiry,
  };

  okResponse(req, res, renewAuthResponse);
}

export { renewAuthentication };
