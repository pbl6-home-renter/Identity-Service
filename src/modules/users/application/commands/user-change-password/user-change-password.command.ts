import { ICommand } from '@nestjs/cqrs';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';

/** Fields the caller supplies; the request DTO implements this. */
export interface UserChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export class UserChangePasswordCommand implements ICommand {
  private constructor(
    readonly userId: Uuid,
    readonly currentPassword: string,
    readonly newPassword: string,
    readonly confirmPassword: string,
  ) {}

  static create(
    userId: Uuid,
    request: UserChangePasswordInput,
  ): UserChangePasswordCommand {
    return new UserChangePasswordCommand(
      userId,
      request.currentPassword,
      request.newPassword,
      request.confirmPassword,
    );
  }
}
