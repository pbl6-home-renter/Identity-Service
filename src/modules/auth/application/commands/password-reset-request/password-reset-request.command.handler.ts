import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { USERS_DI_TOKEN } from 'modules/users/users.di-token';
import { IUserRepository } from 'modules/users/domain/repositories/user.repository.interface';
import { UserStatus } from 'shared/domain/enums/user-status.enum';
import { AUTH_DI_TOKEN } from '../../../auth.di-token';
import { IPasswordResetTokenRepository } from '../../../domain/repositories/password-reset-token.repository.interface';
import { ITokenService } from '../../ports/token-service.port';
import { PasswordResetRequestCommand } from './password-reset-request.command';
import { UserNotFoundException } from 'modules/users/domain/exceptions/user-not-found.exception';
import { AuthLoginAccountLockedException } from '../../../domain/exceptions/auth-login-account-locked.exception';
import { PasswordResetToken } from '../../../domain/entities/password-reset-token';
import { Email } from 'modules/users/domain/value-objects/email.vo';

@CommandHandler(PasswordResetRequestCommand)
export class PasswordResetRequestCommandHandler implements ICommandHandler<PasswordResetRequestCommand> {
  constructor(
    @Inject(USERS_DI_TOKEN.REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(AUTH_DI_TOKEN.PASSWORD_RESET_TOKEN_REPOSITORY)
    private readonly passwordResetTokenRepository: IPasswordResetTokenRepository,
    @Inject(AUTH_DI_TOKEN.TOKEN_SERVICE)
    private readonly tokenService: ITokenService,
  ) {}

  async execute(command: PasswordResetRequestCommand): Promise<void> {
    const user = await this.userRepository.findByEmail(
      Email.create(command.email),
    );
    if (!user) {
      throw new UserNotFoundException();
    }
    if (user.status === UserStatus.LOCKED) {
      throw new AuthLoginAccountLockedException(user.lockReason);
    }

    const generatedToken = this.tokenService.generatePasswordResetToken();
    const passwordResetToken = PasswordResetToken.create({
      userId: user.id,
      tokenHash: generatedToken.passwordResetTokenHash,
      expiresAt: generatedToken.expiresAt,
    });
    await this.passwordResetTokenRepository.save(passwordResetToken);
    // TODO: Send generatedToken.rawPasswordResetToken by email.
  }
}
