import { ICommand } from '@nestjs/cqrs';

export class EmailVerificationRequestCommand implements ICommand {
  constructor(public readonly email: string) {}

  static create(
    request: EmailVerificationRequestInput,
  ): EmailVerificationRequestCommand {
    return new EmailVerificationRequestCommand(request.email);
  }
}

export interface EmailVerificationRequestInput {
  email: string;
}
