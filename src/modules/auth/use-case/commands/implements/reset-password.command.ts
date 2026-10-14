import { ICommand } from '@nestjs/cqrs';
import { ResetPasswordRequestDto } from '../../../presentation/request/reset-password.request.dto';

export class ResetPasswordCommand implements ICommand {
  constructor(
    public readonly token: string,
    public readonly newPassword: string,
  ) {}

  static create(request: ResetPasswordRequestDto): ResetPasswordCommand {
    return new ResetPasswordCommand(request.token, request.newPassword);
  }
}
