import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BcryptUtils } from 'utils/bcrypt.utils';
import { AUTH_DI_TOKEN } from 'modules/auth/auth.di-token';
import { IAuthRepository } from 'modules/auth/domain/repositories/auth.repository.interface';
import { InvalidCurrentPasswordException } from '../../../domain/exceptions/invalid-current-password.exception';
import { PasswordMismatchException } from '../../../domain/exceptions/password-mismatch.exception';
import { UserNotFoundException } from '../../../domain/exceptions/user-not-found.exception';
import { User } from '../../../domain/entities/user';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { USERS_DI_TOKEN } from '../../../users.di-token';
import { ChangePasswordCommand } from '../implements/change-password.command';

@CommandHandler(ChangePasswordCommand)
export class ChangePasswordCommandHandler implements ICommandHandler<
  ChangePasswordCommand,
  void
> {
  constructor(
    @Inject(USERS_DI_TOKEN.REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(AUTH_DI_TOKEN.REPOSITORY)
    private readonly authRepository: IAuthRepository,
  ) {}

  async execute(command: ChangePasswordCommand): Promise<void> {
    if (command.newPassword !== command.confirmPassword) {
      throw new PasswordMismatchException();
    }

    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new UserNotFoundException();
    }

    const isCurrentPasswordValid = await BcryptUtils.compare(
      command.currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      throw new InvalidCurrentPasswordException();
    }

    const passwordHash = await BcryptUtils.hash(command.newPassword);
    await this.userRepository.save(
      User.create({
        id: user.id,
        phone: user.phone,
        email: user.email,
        password: passwordHash,
        name: user.name,
        role: user.role,
        status: user.status,
        lockReason: user.lockReason,
        lockedAt: user.lockedAt,
        createdAt: user.createdAt,
        updatedAt: new Date(),
        isDeleted: user.isDeleted,
      }),
    );
    await this.authRepository.revokeActiveRefreshTokensByUserId(user.id);
  }
}
