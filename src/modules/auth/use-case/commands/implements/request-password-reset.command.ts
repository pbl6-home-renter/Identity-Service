import { ICommand } from '@nestjs/cqrs';
import { RequestPasswordResetRequestDto } from '../../../presentation/request/request-password-reset.request.dto';

export class RequestPasswordResetCommand implements ICommand {
  constructor(public readonly email: string) {}

  static create(
    request: RequestPasswordResetRequestDto,
  ): RequestPasswordResetCommand {
    return new RequestPasswordResetCommand(request.email);
  }
}
