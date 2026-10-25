import { ICommand } from '@nestjs/cqrs';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';

/** Fields the caller supplies; the request DTO implements this. */
export interface AuthLogoutInput {
  refreshToken: string;
}

export class AuthLogoutCommand implements ICommand {
  constructor(
    public readonly userId: Uuid,
    public readonly refreshToken: string,
  ) {}

  static create(userId: Uuid, request: AuthLogoutInput): AuthLogoutCommand {
    return new AuthLogoutCommand(userId, request.refreshToken);
  }
}
