import { Request, Response } from "express";
import { HttpStatusCode } from "axios";
import {
  oneYearInMillis,
  SpinderClientError,
  SpinderServerError,
} from "../utils/utils.js";
import { verifyAndDecodeFirebaseIdToken } from "../firebase/firebase.spinder.js";
import { authLogger } from "../utils/logger.js";
import { refreshSpotifyAccessToken } from "../spotify/spotify.api.js";
import { spotifyTokenToAuthToken } from "./auth.utils.js";

const BEARER = "Bearer";

function ensureSpotifyAccessToken(
  forceRefresh: boolean
): (req: Request, res: Response, next: any) => void {
  return async (req: Request, res: Response, next: any) => {
    const accessToken = req.cookies.spinder_spotify_access_token || null;
    const refreshToken = req.cookies.spinder_spotify_refresh_token || null;

    if (accessToken && !forceRefresh) next();
    else if (refreshToken) {
      try {
        const spotifyToken = await refreshSpotifyAccessToken(refreshToken);
        const authToken = spotifyTokenToAuthToken(spotifyToken);

        req.cookies.spinder_spotify_access_token = authToken.accessToken;
        req.cookies.spinder_spotify_access_token_expiry = authToken.maxAge;

        res.cookie("spinder_spotify_access_token", authToken.accessToken, {
          maxAge: authToken.maxAge,
          httpOnly: true,
          secure: true,
        });
        res.cookie("spinder_spotify_refresh_token", authToken.refreshToken, {
          maxAge: oneYearInMillis,
          httpOnly: true,
          secure: true,
        });
        authLogger.debug(
          `Finished refresh login: Token - ${authToken.accessToken}, Expiry - ${authToken.maxAge}`
        );
        next();
      } catch (error) {
        console.error(error);
        next(
          new SpinderServerError(
            HttpStatusCode.Unauthorized,
            new Error(
              `Failed to refresh spotify access token. Refresh token: ${refreshToken}`
            )
          )
        );
      }
    } else {
      next(
        new SpinderServerError(
          HttpStatusCode.Unauthorized,
          new Error(
            `Failed to refresh spotify access token. Refresh token: ${refreshToken}`
          )
        )
      );
    }
  };
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
      const decodedToken = await verifyAndDecodeFirebaseIdToken(idToken);
      req.cookies.userId = decodedToken.uid;
      req.cookies.firebase_token = idToken;
      req.cookies.firebase_token_expiry =
        decodedToken.exp * 1000 - new Date().getTime(); // Convert to remaining millis
      authLogger.debug(
        `Ensured that the user with id: ${req.cookies.userId} is authorized.`
      );
      next(); //User is authenticated, continue to the next handler.
    } catch (error) {
      console.error(error);
      next(
        new SpinderServerError(
          HttpStatusCode.Unauthorized,
          new Error(
            `Failed to exchange firebase id token for user id. Id token: ${idToken}`
          )
        )
      );
    }
  } else {
    next(
      new SpinderServerError(
        HttpStatusCode.Unauthorized,
        new Error(
          `Failed to exchange firebase id token for user id. Id token: ${idToken}`
        )
      )
    );
  }
}

function authRequestLogger(req: Request, res: Response, next: () => void) {
  authLogger.debug(`Recieved an /auth ${req.method} request to ${req.url}`);
  next();
}

function authErrorHandler(
  err: SpinderServerError,
  req: Request,
  res: Response,
  next: any
) {
  authLogger.error(
    `Origin Url: ${req.originalUrl}, Message: ${err.error.message}`
  );
  authLogger.error(err.error.stack);
  res.status(err.status).json(new SpinderClientError(err));
}

export {
  ensureSpotifyAccessToken,
  ensureFirebaseAuthenticatedUser,
  authRequestLogger,
  authErrorHandler,
};
