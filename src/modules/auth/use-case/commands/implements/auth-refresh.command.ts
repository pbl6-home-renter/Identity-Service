import { ICommand } from '@nestjs/cqrs';
import { AuthRefreshTokenRequestDto } from '../../../presentation/request/auth-refresh-token.request.dto';

export class AuthRefreshCommand implements ICommand {
  constructor(public readonly refreshToken: string) {}

  static create(request: AuthRefreshTokenRequestDto): AuthRefreshCommand {
    return new AuthRefreshCommand(request.refreshToken);
  }
}
