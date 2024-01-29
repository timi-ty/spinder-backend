import { Request, Response } from "express";
import { HttpStatusCode } from "axios";
import { oneYearInMillis, SpinderErrorResponse } from "../utils/utils.js";
import { refreshSpotifyAuthToken } from "./auth.utils.js";
import { exchangeFirebaseIdTokenForUserId } from "../firebase/firebase.spinder.js";

const ERR_AUTH_ERROR = "auth_reauth_required"; //Failed to authenticate request. User must be logged in afresh.
const BEARER = "Bearer";

async function ensureSpotifyAccessToken(
  req: Request,
  res: Response,
  next: any
) {
  const accessToken = req.cookies?.spinder_spotify_access_token || null;
  const refreshToken = req.cookies?.spinder_spotify_refresh_token || null;

  if (accessToken) next();
  else if (refreshToken) {
    try {
      const authToken = await refreshSpotifyAuthToken(refreshToken);

      console.log(
        `Finished refresh login: Token - ${authToken.accessToken}, Expiry - ${authToken.maxAge}`
      );

      req.cookies.spinder_spotify_access_token = authToken.accessToken;

      res.cookie("spinder_spotify_access_token", authToken.accessToken, {
        maxAge: authToken.maxAge,
        httpOnly: true,
      });
      res.cookie("spinder_spotify_refresh_token", authToken.refreshToken, {
        maxAge: oneYearInMillis,
        httpOnly: true,
      });
      next();
    } catch (err: any) {
      next(new SpinderErrorResponse(ERR_AUTH_ERROR, err));
    }
  } else {
    res
      .status(HttpStatusCode.Unauthorized)
      .json(new SpinderErrorResponse(ERR_AUTH_ERROR, "Go back to home page."));
  }
}

async function ensureFirebaseAuthenticatedUser(
  req: Request,
  res: Response,
  next: any
) {
  const authorization = req.headers?.authorization || null;
  const authorizationContent = authorization ? authorization.split(" ") : null;
  const idToken =
    authorizationContent &&
    authorizationContent.length === 2 &&
    authorizationContent[0] === BEARER
      ? authorizationContent[1]
      : null;

  if (idToken) {
    try {
      const userId = exchangeFirebaseIdTokenForUserId(idToken);
      req.cookies.userId = userId;
    } catch (error: any) {
      next(new SpinderErrorResponse(ERR_AUTH_ERROR, error));
    }
  } else {
    res
      .status(HttpStatusCode.Unauthorized)
      .json(
        new SpinderErrorResponse(
          ERR_AUTH_ERROR,
          "Send Authorization header in the correct format {Bearer (idToken)}."
        )
      );
  }
}

export {
  ERR_AUTH_ERROR,
  ensureSpotifyAccessToken,
  ensureFirebaseAuthenticatedUser,
};
