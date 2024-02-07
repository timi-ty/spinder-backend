import { SpotifyToken } from "../spotify/spotify.model.js";
import { AuthToken } from "./auth.model.js";

function spotifyTokenToAuthToken(spotifyAuthToken: SpotifyToken): AuthToken {
  const authToken: AuthToken = {
    accessToken: spotifyAuthToken.access_token,
    maxAge: spotifyAuthToken.expires_in * 1000, //Spotify gives expiration in seconds but we need it in milliseconds.
    refreshToken: spotifyAuthToken.refresh_token,
  };
  return authToken;
}

export { spotifyTokenToAuthToken };
