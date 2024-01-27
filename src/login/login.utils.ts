import axios from "axios";
import { statusOk } from "../utils/utils.js";

interface AuthToken {
  token: string;
  maxAge: number;
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
        token: response.data.access_token,
        maxAge: response.data.expires_in * 1000, //Spotify gives expiry in seconds. Convert to milliseconds.
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
