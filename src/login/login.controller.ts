import { HttpStatusCode } from "axios";
import randomstring from "randomstring";
import querystring from "querystring";
import { v4 as uuidv4 } from "uuid";
import { Request, Response } from "express";
import { createFirebaseCustomToken } from "../firebase/firebase.spinder.js";
import { updateOrCreateSpinderUserData } from "../user/user.utils.js";
import { FinalizeLoginData, SilentLoginData } from "./login.model.js";
import {
  SpinderServerError,
  fiveMinutesInMillis,
  okRedirect,
  okResponse,
  oneHourInMillis,
  oneYearInMillis,
} from "../utils/utils.js";
import { loginLogger } from "../utils/logger.js";
import {
  getSpotifyUserProfile,
  requestSpotifyAccessToken,
} from "../spotify/spotify.api.js";
import { SpotifyUserProfileData } from "../spotify/spotify.model.js";
import { spotifyTokenToAuthToken } from "../auth/auth.utils.js";

//TODO: Purge this Map of stale entries at intervals.
const spotifyLoginStates: Map<string, string> = new Map(); //This map associates 5 minute cookies to Spotify login state. When a login callback is received, the callback req MUST have a cookie that exists in this map and the content MUST be the corresponding state.

//Launches the Spotify Authorization flow.
function startLoginWithSpotify(req: Request, res: Response) {
  const state = randomstring.generate(16);
  const scope =
    "user-read-private user-read-email playlist-read-private user-top-read playlist-modify-public playlist-modify-private";

  const uniqueId = uuidv4();
  spotifyLoginStates.set(uniqueId, state); //Associate every login request with a unique id.

  const loginId: string = req.cookies.loginId || null;

  if (loginId) spotifyLoginStates.delete(loginId);

  res.cookie("loginId", uniqueId, {
    maxAge: fiveMinutesInMillis,
    httpOnly: true,
  }); //Create a cookie with this uniqueId. Overwrite previously existing cookies to ensure that only the newest login attempt from a browser is valid.

  const redirectUrl =
    "https://accounts.spotify.com/authorize?" +
    querystring.stringify({
      response_type: "code",
      client_id: process.env.SPOTIFY_CLIENT_ID,
      scope: scope,
      redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
      state: state,
      show_dialog: true,
    });
  okRedirect(req, res, redirectUrl);
}

//Finishes the Spotify Authorization flow. This is a callback touched directly by the browser so it should not send a JSON response. It redirects instead.
async function finishLoginWithSpotify(
  req: Request,
  res: Response,
  next: (error: SpinderServerError) => void
) {
  const code = req.query.code || null;
  const state = req.query.state || null;
  const loginId: string = req.cookies.loginId || null;
  const confirmState: string | null = loginId
    ? spotifyLoginStates.get(loginId) || null
    : null;
  const acceptRequest: boolean =
    (code && state && confirmState && state === confirmState) || false;

  if (acceptRequest) {
    try {
      const spotifyToken = await requestSpotifyAccessToken(code as string); //Properly validate code to avoid this hack.
      const authToken = spotifyTokenToAuthToken(spotifyToken);
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
      loginLogger.debug(
        `Finished login: Token - ${authToken.accessToken}, Expiry - ${authToken.maxAge}`
      );
      okRedirect(req, res, process.env.FRONTEND_ROOT || ""); //Tell the front-end to call the finalize login endpoint.
    } catch (error) {
      console.error(error);
      next(
        new SpinderServerError(
          HttpStatusCode.InternalServerError,
          new Error("Failed to get spotify access token.")
        )
      );
    }
  } else {
    const errorMessage = req.query.error
      ? "User denied spotify access."
      : "Spinder rejected authentication request.";
    const status = req.query.error
      ? HttpStatusCode.BadRequest
      : HttpStatusCode.InternalServerError;
    next(new SpinderServerError(status, new Error(errorMessage)));
  }
}

//This is the last endpoint touched for a fresh authentication and the only endpoint touched for a silent login.
async function finalizeLogin(
  req: Request,
  res: Response,
  next: (error: SpinderServerError) => void
) {
  //This cookie is set when finishing Spotify login.
  const accessToken: string = req.cookies.spinder_spotify_access_token || null;
  var userProfile: SpotifyUserProfileData | null = null;

  //If login has been previously finalized, the custom token will still be available and we can login silently (quicker).
  const customToken: string = req.cookies.spinder_firebase_custom_token || null;

  //Silent login.
  if (customToken) {
    try {
      const finalizeLoginData: FinalizeLoginData = {
        firebaseCustomToken: customToken,
      };
      loginLogger.debug(
        `Silently logging in user with custom token: ${customToken}`
      );
      okResponse(req, res, finalizeLoginData);
    } catch (error) {
      console.error(error);
      next(
        new SpinderServerError(
          HttpStatusCode.InternalServerError,
          new Error(`Failed to finalize (silent) login with firebase for user.`)
        )
      );
    }
    return;
  }

  //Verbose login.
  try {
    userProfile = await getSpotifyUserProfile(accessToken);
  } catch (error) {
    console.error(error);
    next(
      new SpinderServerError(
        HttpStatusCode.InternalServerError,
        new Error(
          `Failed to get user's Spotify profile data with, Access token: ${accessToken}.`
        )
      )
    );
    return;
  }

  try {
    const finalizeLoginData: FinalizeLoginData = {
      firebaseCustomToken: await createFirebaseCustomToken(userProfile.id),
    };
    const refreshToken = req.cookies.spinder_spotify_refresh_token || null;
    await updateOrCreateSpinderUserData(
      userProfile.id,
      accessToken,
      refreshToken
    );
    res.cookie(
      "spinder_firebase_custom_token",
      finalizeLoginData.firebaseCustomToken,
      {
        maxAge: oneHourInMillis,
        httpOnly: true,
        secure: true,
      }
    );
    okResponse(req, res, finalizeLoginData);
  } catch (error) {
    console.error(error);
    next(
      new SpinderServerError(
        HttpStatusCode.InternalServerError,
        new Error(
          `Failed to finalize login with firebase for user with, Id: ${userProfile.id}.`
        )
      )
    );
  }
}

export { startLoginWithSpotify, finishLoginWithSpotify, finalizeLogin };
