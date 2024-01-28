import { HttpStatusCode } from "axios";
import randomstring from "randomstring";
import querystring from "querystring";
import { v4 as uuidv4 } from "uuid";
import { Request, Response, json } from "express";
import { createFirebaseCustomToken } from "../firebase/firebase.spinder.js";
import { requestSpotifyAuthToken } from "../auth/auth.utils.js";
import { getSpotifyProfile } from "../user/user.utils.js";
import { SpotifyUserProfileData } from "../user/user.model.js";
import { FinalizeLoginData, FinalizeLoginResponse } from "./login.model.js";
import {
  STATUS_OK,
  SpinderErrorResponse,
  fiveMinutesInMillis,
  oneYearInMillis,
} from "../utils/utils.js";
import {
  ERR_LOGIN_ACCESS_DENIED,
  ERR_LOGIN_FINALIZE_DENIED,
  ERR_LOGIN_OTHER_ERROR,
} from "./login.middleware.js";

//TODO: Purge this Map of stale entries at intervals.
const spotifyLoginStates: Map<string, string> = new Map(); //This map associates 5 minute cookies to Spotify login state. When a login callback is received, the callback req MUST have a cookie that exists in this map and the content MUST be the corresponding state.

//Launches the Spotify Authorization flow.
function startLoginWithSpotify(req: Request, res: Response) {
  const state = randomstring.generate(16);
  const scope = "user-read-private user-read-email";

  const uniqueId = uuidv4();
  spotifyLoginStates.set(uniqueId, state); //Associate every login request with a unique id.

  const loginId = req.cookies?.loginId || null;

  if (loginId) spotifyLoginStates.delete(loginId);

  res.cookie("loginId", uniqueId, {
    maxAge: fiveMinutesInMillis,
    httpOnly: true,
  }); //Create a cookie with this uniqueId. Overwrite previously existing cookies to ensure that only the newest login attempt from a browser is valid.

  console.log(`Received login request with ID - ${uniqueId}, State - ${state}`);

  res.status(HttpStatusCode.SeeOther).redirect(
    "https://accounts.spotify.com/authorize?" +
      querystring.stringify({
        response_type: "code",
        client_id: process.env.SPOTIFY_CLIENT_ID,
        scope: scope,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
        state: state,
        show_dialog: true,
      })
  );
}

//Finishes the Spotify Authorization flow. This is a callback touched directly by the browser so it should not send a JSON response. It redirects instead.
async function finishLoginWithSpotify(
  req: Request,
  res: Response,
  next: (error: SpinderErrorResponse) => void
) {
  const code = req.query.code || null;
  const state = req.query.state || null;
  const loginId = req.cookies?.loginId || null;
  const confirmState = loginId ? spotifyLoginStates.get(loginId) : null;
  const acceptRequest = code && state && confirmState && state === confirmState;

  console.log(`Received login callback with ID - ${loginId}, State - ${state}`);

  if (acceptRequest) {
    try {
      const authToken = await requestSpotifyAuthToken(code);

      console.log(
        `Finished login: Token - ${authToken.accessToken}, Expiry - ${authToken.maxAge}`
      );
      res.cookie("spinder_spotify_access_token", authToken.accessToken, {
        maxAge: authToken.maxAge,
        httpOnly: true,
      });
      res.cookie("spinder_spotify_refresh_token", authToken.refreshToken, {
        maxAge: oneYearInMillis,
        httpOnly: true,
      });
      res
        .status(HttpStatusCode.SeeOther)
        .redirect(`${process.env.FRONTEND_ROOT}`);
    } catch (err: any) {
      next(new SpinderErrorResponse(ERR_LOGIN_OTHER_ERROR, err));
    }
  } else {
    const errorCode = req.query.error
      ? ERR_LOGIN_ACCESS_DENIED
      : ERR_LOGIN_OTHER_ERROR;
    next(
      new SpinderErrorResponse(
        errorCode,
        `Callback request rejected. querryError - ${req.query.error}, code - ${code}, state - ${state}, confirmState - ${confirmState}, loginId - ${loginId}`
      )
    );
  }
}

export async function finalizeLogin(
  req: Request,
  res: Response,
  next: (error: SpinderErrorResponse) => void
) {
  //This cookie is set when finishing Spotify login.
  const accessToken = req.cookies?.spinder_spotify_access_token || null;
  var userProfile: SpotifyUserProfileData | null = null;

  try {
    userProfile = await getSpotifyProfile(accessToken);
  } catch (err) {
    next(
      new SpinderErrorResponse(
        ERR_LOGIN_FINALIZE_DENIED,
        `Failed to get user's Spotify profile data with, Access Token: ${accessToken}. ${err}`
      )
    );
  }

  if (userProfile !== null) {
    try {
      const customToken: FinalizeLoginData = {
        firebaseCustomToken: await createFirebaseCustomToken(userProfile.id),
        spotifyAccessToken: accessToken,
      };
      res
        .status(HttpStatusCode.Accepted)
        .json(new FinalizeLoginResponse(STATUS_OK, customToken));
    } catch (err) {
      next(
        new SpinderErrorResponse(
          ERR_LOGIN_FINALIZE_DENIED,
          `Failed to create custom token. ${err}`
        )
      );
    }
  } else {
    next(
      new SpinderErrorResponse(
        ERR_LOGIN_FINALIZE_DENIED,
        `Failed to get user's Spotify profile data.`
      )
    );
  }
}

export { startLoginWithSpotify, finishLoginWithSpotify };
