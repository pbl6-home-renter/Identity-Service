import { ICommand } from '@nestjs/cqrs';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { AuthRefreshTokenRequestDto } from '../../../presentation/request/auth-refresh-token.request.dto';

export class AuthLogoutCommand implements ICommand {
  constructor(
    public readonly userId: Uuid,
    public readonly refreshToken: string,
  ) {}

  static create(
    userId: Uuid,
    request: AuthRefreshTokenRequestDto,
  ): AuthLogoutCommand {
    return new AuthLogoutCommand(userId, request.refreshToken);
  }
}
