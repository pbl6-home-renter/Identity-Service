import { ICommand } from '@nestjs/cqrs';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { ChangePasswordRequestDto } from '../../../presentation/request/change-password.request.dto';

export class ChangePasswordCommand implements ICommand {
  private constructor(
    readonly userId: Uuid,
    readonly currentPassword: string,
    readonly newPassword: string,
    readonly confirmPassword: string,
  ) {}

  static create(
    userId: Uuid,
    request: ChangePasswordRequestDto,
  ): ChangePasswordCommand {
    return new ChangePasswordCommand(
      userId,
      request.currentPassword,
      request.newPassword,
      request.confirmPassword,
    );
  }
}
