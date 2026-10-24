import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BcryptUtils } from 'utils/bcrypt.utils';
import { AUTH_DI_TOKEN } from '../../../auth.di-token';
import { IAuthRepository } from '../../../domain/repositories/auth.repository.interface';
import { ITokenService } from '../../../domain/services/token.service.interface';
import { ResetPasswordCommand } from '../implements/reset-password.command';

@CommandHandler(ResetPasswordCommand)
export class ResetPasswordCommandHandler implements ICommandHandler<ResetPasswordCommand> {
  constructor(
    @Inject(AUTH_DI_TOKEN.REPOSITORY)
    private readonly authRepository: IAuthRepository,
    @Inject(AUTH_DI_TOKEN.TOKEN_SERVICE)
    private readonly tokenService: ITokenService,
  ) {}

  async execute(command: ResetPasswordCommand): Promise<void> {
    const tokenHash = this.tokenService.hashPasswordResetToken(command.token);
    const passwordHash = await BcryptUtils.hash(command.newPassword);
    await this.authRepository.resetPasswordWithToken(tokenHash, passwordHash);
  }
}
