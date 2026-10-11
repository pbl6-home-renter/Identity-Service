import { User } from '../../../users/domain/entities/user';

export class AuthResultVo {
  constructor(
    public readonly accessToken: string,
    public readonly refreshToken: string,
    public readonly user: User,
  ) {}
}
