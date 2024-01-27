import axios from "axios";
import { statusOk } from "../utils/utils.js";
import { response } from "express";

interface AuthToken {
  accessToken: string;
  maxAge: number;
  refreshToken: string;
}

export async function requestSpotifyAuthToken(code: any): Promise<AuthToken> {
  var authOptions = {
    url: "https://accounts.spotify.com/api/token",
    form: {
      code: code,
      redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
      grant_type: "authorization_code",
    },
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(
          process.env.SPOTIFY_CLIENT_ID +
            ":" +
            process.env.SPOTIFY_CLIENT_SECRET
        ).toString("base64"),
    },
    json: true,
  };

  try {
    const response = await axios.post(authOptions.url, authOptions.form, {
      headers: authOptions.headers,
    });

    if (statusOk(response.status)) {
      return {
        accessToken: response.data.access_token,
        maxAge: response.data.expires_in * 1000, //Spotify gives expiry in seconds. Convert to milliseconds.
        refreshToken: response.data.refresh_token,
      };
    } else {
      throw new Error(
        `Spotify rejected login - Status: ${
          response.status
        }, Message - ${JSON.stringify(response.data)}`
      );
    }
  } catch (err) {
    throw new Error(`Auth request failed. ${err}`);
  }
}

export async function refreshSpotifyAuthToken(
  refreshToken: string
): Promise<AuthToken> {
  try {
    var authOptions = {
      url: "https://accounts.spotify.com/api/token",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(
            process.env.SPOTIFY_CLIENT_ID +
              ":" +
              process.env.SPOTIFY_CLIENT_SECRET
          ).toString("base64"),
      },
      form: {
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      },
      json: true,
    };

    const response = await axios.post(authOptions.url, authOptions.form, {
      headers: authOptions.headers,
    });

    if (statusOk(response.status)) {
      return {
        accessToken: response.data.access_token,
        maxAge: response.data.expires_in * 1000, //Spotify gives expiry in seconds. Convert to milliseconds.
        refreshToken: refreshToken, //We don't receive a new refresh token.
      };
    } else {
      throw new Error(
        `Spotify rejected refresh login - Status: ${
          response.status
        }, Message - ${JSON.stringify(response.data)}`
      );
    }
  } catch (err) {
    throw new Error(`Auth refresh request failed. ${err}`);
  }
}
