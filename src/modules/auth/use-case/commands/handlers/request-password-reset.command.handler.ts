import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { USERS_DI_TOKEN } from '../../../../users/users.di-token';
import { IUserRepository } from '../../../../users/domain/repositories/user.repository.interface';
import { UserStatus } from '../../../../users/domain/enums/user-status.enum';
import { AUTH_DI_TOKEN } from '../../../auth.di-token';
import { IPasswordResetTokenRepository } from '../../../domain/repositories/password-reset-token.repository.interface';
import { TokenService } from '../../../infra/services/token.service';
import { RequestPasswordResetCommand } from '../implements/request-password-reset.command';
import { UserNotFoundException } from '../../../../users/domain/exceptions/user-not-found.exception';
import { AccountLockedException } from '../../../domain/exceptions/account-locked.exception';
import { PasswordResetToken } from '../../../domain/entities/password-reset-token';

@CommandHandler(RequestPasswordResetCommand)
export class RequestPasswordResetCommandHandler implements ICommandHandler<RequestPasswordResetCommand> {
  constructor(
    @Inject(USERS_DI_TOKEN.REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(AUTH_DI_TOKEN.PASSWORD_RESET_TOKEN_REPOSITORY)
    private readonly passwordResetTokenRepository: IPasswordResetTokenRepository,
    private readonly tokenService: TokenService,
  ) {}

  async execute(command: RequestPasswordResetCommand): Promise<void> {
    const user = await this.userRepository.findByEmail(command.email);
    if (!user) {
      throw new UserNotFoundException();
    }
    if (user.status === UserStatus.LOCKED) {
      throw new AccountLockedException(user.lockReason);
    }

    const generatedToken = this.tokenService.generatePasswordResetToken();
    const passwordResetToken = PasswordResetToken.create({
      userId: user.id,
      tokenHash: generatedToken.tokenHash,
      expiresAt: generatedToken.expiresAt,
    });
    await this.passwordResetTokenRepository.save(passwordResetToken);
    // TODO: Send generatedToken.rawToken by email.
  }
}
