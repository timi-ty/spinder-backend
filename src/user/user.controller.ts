import { Request, Response } from "express";
import { SpinderError, okResponse } from "../utils/utils.js";
import { HttpStatusCode } from "axios";
import { userLogger } from "../utils/logger.js";
import { getSpotifyProfile } from "../spotify/spotify.api.js";
import { SpotifyUserProfileData } from "../spotify/spotify.model.js";

async function returnSpotifyUserProfile(
  req: Request,
  res: Response,
  next: (error: SpinderError) => void
) {
  try {
    const accessToken = req.cookies.spinder_spotify_access_token || null;
    var userProfile: SpotifyUserProfileData;
    userProfile = await getSpotifyProfile(accessToken);
    okResponse(req, res, userProfile);
  } catch (error) {
    userLogger.error(error);
    next(
      new SpinderError(
        HttpStatusCode.InternalServerError,
        new Error("Failed to get user's Spotify profile data.")
      )
    );
  }
}

export { returnSpotifyUserProfile };
