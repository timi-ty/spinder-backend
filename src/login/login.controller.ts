import { HttpStatusCode } from "axios";
import randomstring from "randomstring";
import querystring from "querystring";
import { v4 as uuidv4 } from "uuid";
import { Request, Response, json } from "express";
import {
  createFirebaseCustomToken,
  setFirestoreDocData,
} from "../firebase/firebase.spinder.js";
import { requestSpotifyAuthToken } from "../auth/auth.utils.js";
import { getSpotifyProfile } from "../user/user.utils.js";
import {
  SpotifyUserProfileData,
  defaultSpinderUserData,
} from "../user/user.model.js";
import { FinalizeLoginData } from "./login.model.js";
import {
  SpinderError,
  fiveMinutesInMillis,
  okRedirect,
  okResponse,
  oneYearInMillis,
} from "../utils/utils.js";

//TODO: Purge this Map of stale entries at intervals.
const spotifyLoginStates: Map<string, string> = new Map(); //This map associates 5 minute cookies to Spotify login state. When a login callback is received, the callback req MUST have a cookie that exists in this map and the content MUST be the corresponding state.

//Launches the Spotify Authorization flow.
function startLoginWithSpotify(req: Request, res: Response) {
  const state = randomstring.generate(16);
  const scope = "user-read-private user-read-email";

  const uniqueId = uuidv4();
  spotifyLoginStates.set(uniqueId, state); //Associate every login request with a unique id.

  const loginId = req.cookies.loginId || null;

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
  next: (error: SpinderError) => void
) {
  const code = req.query.code || null;
  const state = req.query.state || null;
  const loginId = req.cookies?.loginId || null;
  const confirmState = loginId ? spotifyLoginStates.get(loginId) : null;
  const acceptRequest = code && state && confirmState && state === confirmState;

  if (acceptRequest) {
    try {
      const authToken = await requestSpotifyAuthToken(code);
      res.cookie("spinder_spotify_access_token", authToken.accessToken, {
        maxAge: authToken.maxAge,
        httpOnly: true,
      });
      res.cookie("spinder_spotify_refresh_token", authToken.refreshToken, {
        maxAge: oneYearInMillis,
        httpOnly: true,
      });
      console.log(
        `Finished login: Token - ${authToken.accessToken}, Expiry - ${authToken.maxAge}`
      );
      okRedirect(req, res, process.env.FRONTEND_ROOT || "");
    } catch (error) {
      console.error(error);
      next(
        new SpinderError(
          HttpStatusCode.SeeOther,
          "Failed to get spotify access token."
        )
      );
    }
  } else {
    const errorMessage = req.query.error
      ? "User denied spotify access."
      : "Spinder rejected authentication request.";
    next(new SpinderError(HttpStatusCode.SeeOther, errorMessage));
  }
}

async function finalizeLogin(
  req: Request,
  res: Response,
  next: (error: SpinderError) => void
) {
  //This cookie is set when finishing Spotify login.
  const accessToken = req.cookies.spinder_spotify_access_token || null;
  var userProfile: SpotifyUserProfileData | null = null;

  try {
    userProfile = await getSpotifyProfile(accessToken);
  } catch (error) {
    console.error(error);
    next(
      new SpinderError(
        HttpStatusCode.InternalServerError,
        `Failed to get user's Spotify profile data with, Access Token: ${accessToken}.`
      )
    );
    return;
  }

  try {
    const customToken: FinalizeLoginData = {
      firebaseCustomToken: await createFirebaseCustomToken(userProfile.id),
      spotifyAccessToken: accessToken,
    };
    setFirestoreDocData(
      `users/${userProfile.id}`,
      defaultSpinderUserData,
      true
    );
    okResponse(req, res, customToken);
  } catch (error) {
    console.error(error);
    next(
      new SpinderError(
        HttpStatusCode.InternalServerError,
        `Failed to finalize login with firebase for user with, ID: ${userProfile.id}.`
      )
    );
  }
}

export { startLoginWithSpotify, finishLoginWithSpotify, finalizeLogin };
