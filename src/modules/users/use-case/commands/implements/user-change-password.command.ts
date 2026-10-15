import { ICommand } from '@nestjs/cqrs';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { UserChangePasswordRequestDto } from '../../../presentation/request/user-change-password.request.dto';

export class UserChangePasswordCommand implements ICommand {
  private constructor(
    readonly userId: Uuid,
    readonly currentPassword: string,
    readonly newPassword: string,
    readonly confirmPassword: string,
  ) {}

  static create(
    userId: Uuid,
    request: UserChangePasswordRequestDto,
  ): UserChangePasswordCommand {
    return new UserChangePasswordCommand(
      userId,
      request.currentPassword,
      request.newPassword,
      request.confirmPassword,
    );
  }
}
