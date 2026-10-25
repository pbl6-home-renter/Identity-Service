import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IPasswordHasher } from 'modules/users/application/ports/password-hasher.port';
import { USERS_DI_TOKEN } from 'modules/users/users.di-token';
import { AUTH_DI_TOKEN } from '../../../auth.di-token';
import { IAuthRepository } from '../../../domain/repositories/auth.repository.interface';
import { ITokenService } from '../../ports/token-service.port';
import { PasswordResetConfirmCommand } from './password-reset-confirm.command';

@CommandHandler(PasswordResetConfirmCommand)
export class PasswordResetConfirmCommandHandler implements ICommandHandler<PasswordResetConfirmCommand> {
  constructor(
    @Inject(USERS_DI_TOKEN.PASSWORD_HASHER)
    private readonly passwordHasher: IPasswordHasher,
    @Inject(AUTH_DI_TOKEN.REPOSITORY)
    private readonly authRepository: IAuthRepository,
    @Inject(AUTH_DI_TOKEN.TOKEN_SERVICE)
    private readonly tokenService: ITokenService,
  ) {}

  async execute(command: PasswordResetConfirmCommand): Promise<void> {
    const tokenHash = this.tokenService.hashPasswordResetToken(command.token);
    const passwordHash = await this.passwordHasher.hash(command.newPassword);
    await this.authRepository.resetPasswordWithToken(tokenHash, passwordHash);
  }
}
