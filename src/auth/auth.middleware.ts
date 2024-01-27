import { Request, Response } from "express";
import { HttpStatusCode } from "axios";
import { oneYearInMillis, SpinderErrorResponse } from "../utils/utils.js";
import { refreshSpotifyAuthToken } from "./auth.utils.js";

export const ERR_AUTH_ERROR = "auth_reauth_required"; //Failed to authenticate request. User must be logged in afresh.

export async function ensureSpotifyAccessToken(
  req: Request,
  res: Response,
  next: any
) {
  const accessToken = req.cookies?.spinder_spotify_access_token || null;
  const refreshToken = req.cookies?.spinder_spotify_refresh_token || null;

  if (accessToken) next();
  else if (!accessToken && refreshToken) {
    try {
      const authToken = await refreshSpotifyAuthToken(refreshToken);

      console.log(
        `Finished refresh login: Token - ${authToken.accessToken}, Expiry - ${authToken.maxAge}`
      );

      if (req.cookies)
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
