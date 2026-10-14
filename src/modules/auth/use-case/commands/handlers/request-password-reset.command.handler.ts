import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { USERS_DI_TOKEN } from '../../../../users/users.di-token';
import { IUserRepository } from '../../../../users/domain/repositories/user.repository.interface';
import { UserStatus } from '../../../../users/domain/enums/user-status.enum';
import { AUTH_DI_TOKEN } from '../../../auth.di-token';
import { IAuthRepository } from '../../../domain/repositories/auth.repository.interface';
import { TokenService } from '../../../infra/services/token.service';
import { MailService } from '../../../infra/services/mail.service';
import { RequestPasswordResetCommand } from '../implements/request-password-reset.command';

@CommandHandler(RequestPasswordResetCommand)
export class RequestPasswordResetCommandHandler implements ICommandHandler<RequestPasswordResetCommand> {
  private readonly logger = new Logger(RequestPasswordResetCommandHandler.name);

  constructor(
    @Inject(USERS_DI_TOKEN.REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(AUTH_DI_TOKEN.REPOSITORY)
    private readonly authRepository: IAuthRepository,
    private readonly tokenService: TokenService,
    private readonly mailService: MailService,
  ) {}

  async execute(command: RequestPasswordResetCommand): Promise<void> {
    try {
      const user = await this.userRepository.findByEmail(command.email);
      if (!user || user.status === UserStatus.LOCKED) {
        return;
      }

      const { rawToken, tokenHash, expiresAt } =
        this.tokenService.generatePasswordResetToken();
      await this.authRepository.savePasswordResetToken(
        user.id,
        tokenHash,
        expiresAt,
      );

      await this.mailService.sendPasswordResetEmail(user.email, rawToken);
    } catch (error) {
      this.logger.error(
        'Password reset request processing failed.',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
