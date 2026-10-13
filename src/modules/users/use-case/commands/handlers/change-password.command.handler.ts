import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { PasswordMismatchException } from '../../../domain/exceptions/password-mismatch.exception';
import { USERS_DI_TOKEN } from '../../../users.di-token';
import { ChangePasswordCommand } from '../implements/change-password.command';

@CommandHandler(ChangePasswordCommand)
export class ChangePasswordCommandHandler implements ICommandHandler<
  ChangePasswordCommand,
  void
> {
  constructor(
    @Inject(USERS_DI_TOKEN.REPOSITORY)
    private readonly repository: IUserRepository,
  ) {}
  async execute(command: ChangePasswordCommand): Promise<void> {
    if (command.newPassword !== command.confirmPassword)
      throw new PasswordMismatchException();
    await this.repository.changePassword(
      command.userId,
      command.currentPassword,
      command.newPassword,
    );
  }
}
