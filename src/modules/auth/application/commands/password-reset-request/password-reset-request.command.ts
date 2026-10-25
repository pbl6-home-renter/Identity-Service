import { ICommand } from '@nestjs/cqrs';

/** Fields the caller supplies; the request DTO implements this. */
export interface PasswordResetRequestInput {
  email: string;
}

export class PasswordResetRequestCommand implements ICommand {
  constructor(public readonly email: string) {}

  static create(
    request: PasswordResetRequestInput,
  ): PasswordResetRequestCommand {
    return new PasswordResetRequestCommand(request.email);
  }
}
