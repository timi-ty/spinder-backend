import axios, { HttpStatusCode } from "axios";
import { authLogger } from "../utils/logger.js";

interface AuthToken {
  accessToken: string;
  maxAge: number;
  refreshToken: string;
}

async function requestSpotifyAuthToken(code: any): Promise<AuthToken> {
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

    if (response.status === HttpStatusCode.Ok) {
      return {
        accessToken: response.data.access_token,
        maxAge: response.data.expires_in * 1000, //Spotify gives expiry in seconds. Convert to milliseconds.
        refreshToken: response.data.refresh_token,
      };
    } else {
      throw new Error(
        `Spotify rejected login - Status: ${response.status}, Message - ${response.data.error.message}`
      );
    }
  } catch (error) {
    console.error(error);
    throw new Error("Auth request failed.");
  }
}

async function refreshSpotifyAuthToken(
  refreshToken: string
): Promise<AuthToken> {
  try {
    var authOptions = {
      url: "https://accounts.spotify.com/api/token",
      form: {
        grant_type: "refresh_token",
        refresh_token: refreshToken,
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

    const response = await axios.post(authOptions.url, authOptions.form, {
      headers: authOptions.headers,
    });

    if (response.status === HttpStatusCode.Ok) {
      return {
        accessToken: response.data.access_token,
        maxAge: response.data.expires_in * 1000, //Spotify gives expiry in seconds. Convert to milliseconds.
        refreshToken: refreshToken, //We don't receive a new refresh token.
      };
    } else {
      throw new Error(
        `Spotify rejected refresh login - Status: ${response.status}, Message - ${response.data.error.message}`
      );
    }
  } catch (error) {
    console.error(error);
    throw new Error("Refresh auth request failed.");
  }
}

export { requestSpotifyAuthToken, refreshSpotifyAuthToken };
