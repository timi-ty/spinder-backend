import { Request, Response } from "express";
import {
  SpotifyUserProfileResponse,
  SpotifyUserProfileData,
} from "./user.model.js";
import { getSpotifyProfile } from "./user.utils.js";
import { STATUS_OK, SpinderErrorResponse } from "../utils/utils.js";
import { ERR_USER_OTHER_ERROR } from "./user.middleware.js";

export async function returnSpotifyUserProfile(
  req: Request,
  res: Response,
  next: (error: SpinderErrorResponse) => void
) {
  const accessToken = req.cookies?.spinder_spotify_access_token || null;
  var userProfile: SpotifyUserProfileData;

  try {
    userProfile = await getSpotifyProfile(accessToken);
    res.json(new SpotifyUserProfileResponse(STATUS_OK, userProfile));
  } catch (err) {
    next(
      new SpinderErrorResponse(
        ERR_USER_OTHER_ERROR,
        `Failed to get user's Spotify profile data. ${err}`
      )
    );
  }
}
