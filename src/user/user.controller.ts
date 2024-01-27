import { Request, Response } from "express";
import { UserPorfileResponse, UserProfileData } from "./user.model.js";
import { getSpotifyProfile } from "./user.utils.js";
import { STATUS_OK, SpinderErrorResponse } from "../utils/utils.js";
import { ERR_USER_OTHER_ERROR } from "./user.middleware.js";

export async function returnSpotifyUserData(
  req: Request,
  res: Response,
  next: (error: SpinderErrorResponse) => void
) {
  const accessToken = req.cookies?.spinder_spotify_access_token || null;
  var userProfile: UserProfileData;

  try {
    userProfile = await getSpotifyProfile(accessToken);
    res.json(new UserPorfileResponse(STATUS_OK, userProfile));
  } catch (err) {
    next(
      new SpinderErrorResponse(
        ERR_USER_OTHER_ERROR,
        `Failed to get user's Spotify profile data. ${err}`
      )
    );
  }
}
