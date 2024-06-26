import { Request, Response } from "express";
import { RenewedAuthData } from "./auth.model.js";
import { SpinderServerError, okResponse } from "../utils/utils.js";
import { updateOrCreateSpinderUserData } from "../user/user.utils.js";
import { HttpStatusCode } from "axios";

async function renewAuthentication(req: Request, res: Response, next: any) {
  try {
    //If no middlewares blocked the request from reaching this point then everything is ok. Respond accordingly.
    const renewAuthResponse: RenewedAuthData = {
      userId: req.cookies.userId,
      spotifyAccessTokenExpiresIn:
        req.cookies.spinder_spotify_access_token_expiry,
      firebaseIdTokenExpiresIn: req.cookies.firebase_token_expiry,
    };

    const accessToken: string =
      req.cookies.spinder_spotify_access_token || null;
    const refreshToken: string =
      req.cookies.spinder_spotify_refresh_token || null;
    await updateOrCreateSpinderUserData(
      renewAuthResponse.userId,
      null, //Leave the current name there.
      null, // Leave the current image there.
      accessToken,
      refreshToken,
      false //This endpoint should never work for anon users
    );

    okResponse(req, res, renewAuthResponse);
  } catch (error) {
    console.error(error);
    next(
      new SpinderServerError(
        HttpStatusCode.InternalServerError,
        new Error(
          "Failed to renew authentication. This is most likely a db read/write failure."
        )
      )
    );
  }
}

export { renewAuthentication };
