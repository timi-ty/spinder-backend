interface AuthToken {
  accessToken: string;
  maxAge: number;
  refreshToken: string;
}

interface RenewedAuth {
  userId: string;
  spotifyAccessToken: string;
  spotifyAccessTokenExpiresIn: number;
  firebaseIdToken: string;
  firebaseIdTokenExpiresIn: number;
}

export { AuthToken, RenewedAuth };
