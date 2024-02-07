interface AuthToken {
  accessToken: string;
  maxAge: number;
  refreshToken: string;
}

export { AuthToken };
