import { ICommand } from '@nestjs/cqrs';

/** Fields the caller supplies; the request DTO implements this. */
export interface PasswordResetConfirmInput {
  token: string;
  newPassword: string;
}

export class PasswordResetConfirmCommand implements ICommand {
  constructor(
    public readonly token: string,
    public readonly newPassword: string,
  ) {}

  static create(
    request: PasswordResetConfirmInput,
  ): PasswordResetConfirmCommand {
    return new PasswordResetConfirmCommand(request.token, request.newPassword);
  }
}
