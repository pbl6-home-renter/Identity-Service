export class AuthRefreshResult {
  constructor(
    public readonly accessToken: string,
    public readonly refreshToken: string,
  ) {}

  static create(accessToken: string, refreshToken: string): AuthRefreshResult {
    return new AuthRefreshResult(accessToken, refreshToken);
  }
}
