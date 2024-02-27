interface AuthToken {
  accessToken: string;
  maxAge: number;
  refreshToken: string;
}

interface RenewedAuthData {
  userId: string;
  spotifyAccessTokenExpiresIn: number;
  firebaseIdTokenExpiresIn: number;
}

export { AuthToken, RenewedAuthData };
