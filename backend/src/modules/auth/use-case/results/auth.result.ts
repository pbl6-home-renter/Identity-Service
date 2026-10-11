import { User } from '../../../users/domain/entities/user';

export class AuthResult {
  constructor(
    public readonly accessToken: string,
    public readonly refreshToken: string,
    public readonly user: User,
  ) {}

  static create(
    accessToken: string,
    refreshToken: string,
    user: User,
  ): AuthResult {
    return new AuthResult(accessToken, refreshToken, user);
  }
}
