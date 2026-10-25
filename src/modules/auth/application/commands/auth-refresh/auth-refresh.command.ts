import { ICommand } from '@nestjs/cqrs';

/** Fields the caller supplies; the request DTO implements this. */
export interface AuthRefreshInput {
  refreshToken: string;
}

export class AuthRefreshCommand implements ICommand {
  constructor(public readonly refreshToken: string) {}

  static create(request: AuthRefreshInput): AuthRefreshCommand {
    return new AuthRefreshCommand(request.refreshToken);
  }
}
