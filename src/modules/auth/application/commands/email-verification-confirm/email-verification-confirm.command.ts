import { ICommand } from '@nestjs/cqrs';

export class EmailVerificationConfirmCommand implements ICommand {
  constructor(public readonly token: string) {}

  static create(
    request: EmailVerificationConfirmInput,
  ): EmailVerificationConfirmCommand {
    return new EmailVerificationConfirmCommand(request.token);
  }
}

export interface EmailVerificationConfirmInput {
  token: string;
}
