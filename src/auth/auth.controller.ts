import { Request, Response } from "express";
import { RenewedAuthData } from "./auth.model.js";
import { SpinderServerError, okResponse } from "../utils/utils.js";
import { updateOrCreateSpinderUserData } from "../user/user.utils.js";
import { HttpStatusCode } from "axios";
import { getAdminAccessToken } from "../services/admin.service.js";

async function renewAuthentication(req: Request, res: Response, next: any) {
  try {
    //If no middlewares blocked the request from reaching this point then everything is ok. Respond accordingly.
    const accessToken: string =
      req.cookies.spinder_spotify_access_token || null;
    const renewAuthResponse: RenewedAuthData = {
      userId: req.cookies.userId,
      spotifyAccessToken: accessToken,
      spotifyAccessTokenExpiresIn:
        req.cookies.spinder_spotify_access_token_expiry,
      firebaseIdTokenExpiresIn: req.cookies.firebase_token_expiry,
    };

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

async function getSpotifyToken(
  req: Request,
  res: Response,
  next: (error: SpinderServerError) => void
) {
  try {
    // Check if this is an anonymous user (has anon_user_id cookie)
    const anonUserId: string = req.cookies.anon_user_id || null;
    let spotifyAccessToken: string;

    if (anonUserId) {
      // Anonymous user - use admin's token
      spotifyAccessToken = await getAdminAccessToken();
    } else {
      // Logged-in user - use their token from cookies
      spotifyAccessToken = req.cookies.spinder_spotify_access_token || null;
      if (!spotifyAccessToken) {
        next(
          new SpinderServerError(
            HttpStatusCode.Unauthorized,
            new Error("No Spotify access token available")
          )
        );
        return;
      }
    }

    okResponse(req, res, { spotifyAccessToken });
  } catch (error) {
    console.error(error);
    next(
      new SpinderServerError(
        HttpStatusCode.InternalServerError,
        new Error("Failed to get Spotify access token")
      )
    );
  }
}

export { renewAuthentication, getSpotifyToken };
