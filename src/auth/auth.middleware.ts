import { Request, Response } from "express";
import { HttpStatusCode } from "axios";
import { oneYearInMillis, SpinderError } from "../utils/utils.js";
import { exchangeFirebaseIdTokenForUserId } from "../firebase/firebase.spinder.js";
import { authLogger } from "../utils/logger.js";
import { refreshSpotifyAccessToken } from "../spotify/spotify.api.js";
import { spotifyTokenToAuthToken } from "./auth.utils.js";

const BEARER = "Bearer";

async function ensureSpotifyAccessToken(
  req: Request,
  res: Response,
  next: any
) {
  const accessToken = req.cookies.spinder_spotify_access_token || null;
  const refreshToken = req.cookies.spinder_spotify_refresh_token || null;

  if (accessToken) next();
  else if (refreshToken) {
    try {
      const spotifyToken = await refreshSpotifyAccessToken(refreshToken);
      const authToken = spotifyTokenToAuthToken(spotifyToken);

      req.cookies.spinder_spotify_access_token = authToken.accessToken;

      res.cookie("spinder_spotify_access_token", authToken.accessToken, {
        maxAge: authToken.maxAge,
        httpOnly: true,
      });
      res.cookie("spinder_spotify_refresh_token", authToken.refreshToken, {
        maxAge: oneYearInMillis,
        httpOnly: true,
      });
      authLogger.debug(
        `Finished refresh login: Token - ${authToken.accessToken}, Expiry - ${authToken.maxAge}`
      );
      next();
    } catch (error) {
      console.error(error);
      next(
        new SpinderError(
          HttpStatusCode.Unauthorized,
          new Error(
            `Failed to refresh spotify access token. Refresh token: ${refreshToken}`
          )
        )
      );
    }
  } else {
    next(
      new SpinderError(
        HttpStatusCode.Unauthorized,
        new Error(
          `Failed to refresh spotify access token. Refresh token: ${refreshToken}`
        )
      )
    );
  }
}

async function ensureFirebaseAuthenticatedUser(
  req: Request,
  res: Response,
  next: any
) {
  const authorization = req.headers.authorization || null;
  const authorizationContent = authorization ? authorization.split(" ") : null;
  const idToken =
    authorizationContent &&
    authorizationContent.length === 2 &&
    authorizationContent[0] === BEARER
      ? authorizationContent[1]
      : null;

  if (idToken) {
    try {
      const userId = await exchangeFirebaseIdTokenForUserId(idToken);
      req.cookies.userId = userId;
      authLogger.debug(
        `Ensured that the user with id: ${req.cookies.userId} is authorized.`
      );
      next(); //User is authenticated, continue to the next handler.
    } catch (error) {
      console.error(error);
      next(
        new SpinderError(
          HttpStatusCode.Unauthorized,
          new Error(
            `Failed to exchange firebase id token for user id. Id token: ${idToken}`
          )
        )
      );
    }
  } else {
    next(
      new SpinderError(
        HttpStatusCode.Unauthorized,
        new Error(
          `Failed to exchange firebase id token for user id. Id token: ${idToken}`
        )
      )
    );
  }
}

export { ensureSpotifyAccessToken, ensureFirebaseAuthenticatedUser };
