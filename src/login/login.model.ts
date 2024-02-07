interface AuthToken {
  accessToken: string;
  maxAge: number;
  refreshToken: string;
}

interface FinalizeLoginData {
  firebaseCustomToken: string;
  spotifyAccessToken: string;
}

export { FinalizeLoginData };
