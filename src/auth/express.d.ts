declare namespace Express {
  interface Request {
    user: {
      sub: string;
      username: string;
      roles: [];
      iat: string;
      exp: string;
    };
  }
}
