import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { IPasswordHasher } from '../../ports/password-hasher.port';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { UserChangePasswordInvalidCurrentException } from '../../../domain/exceptions/user-change-password-invalid-current.exception';
import { UserChangePasswordMismatchException } from '../../../domain/exceptions/user-change-password-mismatch.exception';
import { UserNotFoundException } from '../../../domain/exceptions/user-not-found.exception';
import { USERS_DI_TOKEN } from '../../../users.di-token';
import { UserChangePasswordCommand } from './user-change-password.command';
import { UserPasswordChangedEvent } from '../../../domain/events/user-password-changed.event';

@CommandHandler(UserChangePasswordCommand)
export class UserChangePasswordCommandHandler implements ICommandHandler<
  UserChangePasswordCommand,
  void
> {
  constructor(
    @Inject(USERS_DI_TOKEN.PASSWORD_HASHER)
    private readonly passwordHasher: IPasswordHasher,
    @Inject(USERS_DI_TOKEN.REPOSITORY)
    private readonly repository: IUserRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UserChangePasswordCommand): Promise<void> {
    if (command.newPassword !== command.confirmPassword) {
      throw new UserChangePasswordMismatchException();
    }

    const user = await this.repository.findById(command.userId);
    if (!user) {
      throw new UserNotFoundException();
    }

    const isMatch = await this.passwordHasher.compare(
      command.currentPassword,
      user.password,
    );
    if (!isMatch) {
      throw new UserChangePasswordInvalidCurrentException();
    }

    const hashedNewPassword = await this.passwordHasher.hash(
      command.newPassword,
    );
    await this.repository.updatePassword(command.userId, hashedNewPassword);

    this.eventBus.publish(new UserPasswordChangedEvent(command.userId));
  }
}
