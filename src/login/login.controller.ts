import { HttpStatusCode, all } from "axios";
import randomstring from "randomstring";
import querystring from "querystring";
import { v4 as uuidv4 } from "uuid";
import { Request, Response } from "express";
import {
  createFirebaseCustomToken,
  isExistingFirestoreDoc,
  setFirestoreDoc,
} from "../firebase/firebase.spinder.js";
import { updateOrCreateSpinderUserData } from "../user/user.utils.js";
import { FinalizeLoginData, RequestAccessResult } from "./login.model.js";
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
import {
  resetDestinationDeck,
  refillSourceDeck,
} from "../services/deck.service.js";
import { getAdminAccessToken } from "../services/admin.service.js";

//TODO: Purge this Map of stale entries at intervals.
const spotifyLoginStates: Map<string, string> = new Map(); //This map associates 5 minute cookies to Spotify login state. When a login callback is received, the callback req MUST have a cookie that exists in this map and the content MUST be the corresponding state.

async function requestLoginAccess(
  req: Request,
  res: Response,
  next: (error: SpinderServerError) => void
) {
  try {
    const email = req.query.email || null;
    if (!email) throw new Error("Null email address");
    const allow = await isExistingFirestoreDoc(`allowedUsers/${email}`);
    if (allow) {
      const allow: RequestAccessResult = "Allow";
      okResponse(req, res, allow);
    } else {
      await setFirestoreDoc(`pendingUsers/${email}`, {});
      const pend: RequestAccessResult = "Pend";
      okResponse(req, res, pend);
    }
  } catch (error) {
    console.error(error);
    loginLogger.error("Failed to honor access request.");
    next(
      new SpinderServerError(
        HttpStatusCode.InternalServerError,
        new Error("Failed to honor access request.")
      )
    );
  }
}

//Launches the Spotify Authorization flow.
function startLoginWithSpotify(req: Request, res: Response) {
  deleteAllAuthenticationCookies(res);

  const state = randomstring.generate(16);
  const scope =
    "user-read-private user-read-email playlist-read-private user-top-read playlist-modify-public playlist-modify-private user-library-read user-follow-read user-library-modify";

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

  //If login was previously finalized less than an hour ago, the custom token will still be available and we can login silently (quicker).
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
    //We ensure that the user has their user data on every fresh login
    const refreshToken = req.cookies.spinder_spotify_refresh_token || null;
    const [userData, isNewUser] = await updateOrCreateSpinderUserData(
      userProfile.id,
      userProfile.display_name,
      userProfile.images.length > 0 ? userProfile.images[0].url : "",
      accessToken,
      refreshToken,
      false
    );
    //We carry out these deck initilaization tasks for a new user
    if (isNewUser) {
      refillSourceDeck(
        userProfile.id,
        accessToken,
        userData.selectedDiscoverSource
      );
      resetDestinationDeck(
        userProfile.id,
        accessToken,
        userData.selectedDiscoverDestination
      );
    }
    //End of initialization tasks
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

async function anonymousLogin(
  req: Request,
  res: Response,
  next: (error: SpinderServerError) => void
) {
  //If login was previously finalized less than an hour ago, the custom token will still be available and we can login silently (quicker).
  const customToken: string = req.cookies.spinder_firebase_custom_token || null;
  //If this browser has been used for an anonymous login, it will have an anon cookie
  var userId: string = req.cookies.anon_user_id || null;
  if (userId === null) userId = uuidv4();

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

  try {
    const finalizeLoginData: FinalizeLoginData = {
      firebaseCustomToken: await createFirebaseCustomToken(userId),
    };
    const [userData, isNewUser] = await updateOrCreateSpinderUserData(
      userId,
      "FlyButterfly020",
      "",
      null,
      null,
      true
    );
    //We carry out these deck initilaization tasks for a new user
    if (isNewUser) {
      const accessToken = await getAdminAccessToken();
      refillSourceDeck(userId, accessToken, userData.selectedDiscoverSource);
    }
    //End of initialization tasks
    res.cookie("anon_user_id", userId, {
      maxAge: oneYearInMillis,
      httpOnly: true,
      secure: true,
    });
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
          `Failed to finalize login with firebase for user with, Id: ${userId}.`
        )
      )
    );
  }
}

function logout(
  req: Request,
  res: Response,
  next: (error: SpinderServerError) => void
) {
  deleteAllAuthenticationCookies(res);
  okResponse(req, res, "Logged Out");
}

function deleteAllAuthenticationCookies(res: Response) {
  res.cookie("spinder_spotify_access_token", "", { expires: new Date(0) });
  res.cookie("spinder_spotify_refresh_token", "", { expires: new Date(0) });
  res.cookie("spinder_firebase_custom_token", "", { expires: new Date(0) });
}

export {
  requestLoginAccess,
  startLoginWithSpotify,
  finishLoginWithSpotify,
  finalizeLogin,
  anonymousLogin,
  logout,
};
