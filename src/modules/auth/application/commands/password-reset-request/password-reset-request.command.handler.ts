import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { USERS_DI_TOKEN } from 'modules/users/users.di-token';
import { IUserRepository } from 'modules/users/domain/repositories/user.repository.interface';
import { AUTH_DI_TOKEN } from '../../../auth.di-token';
import { IPasswordResetTokenRepository } from '../../../domain/repositories/password-reset-token.repository.interface';
import { ITokenService } from '../../ports/token-service.port';
import { PasswordResetRequestCommand } from './password-reset-request.command';
import { UserNotFoundException } from 'modules/users/domain/exceptions/user-not-found.exception';
import { PasswordResetToken } from '../../../domain/entities/password-reset-token';
import { Email } from 'modules/users/domain/value-objects/email.vo';
import { UNIT_OF_WORK_DI_TOKEN } from 'shared/application/di-tokens';
import { IUnitOfWork } from 'shared/application/ports/unit-of-work.port';
import { OUTBOX_DI_TOKEN } from 'modules/outbox/outbox.di-token';
import { OutboxRepository } from 'modules/outbox/domain/repositories/outbox.repository';
import { OutboxMessage } from 'modules/outbox/domain/entities/outbox-message.entity';

@CommandHandler(PasswordResetRequestCommand)
export class PasswordResetRequestCommandHandler implements ICommandHandler<PasswordResetRequestCommand> {
  constructor(
    @Inject(USERS_DI_TOKEN.REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(AUTH_DI_TOKEN.PASSWORD_RESET_TOKEN_REPOSITORY)
    private readonly passwordResetTokenRepository: IPasswordResetTokenRepository,
    @Inject(AUTH_DI_TOKEN.TOKEN_SERVICE)
    private readonly tokenService: ITokenService,
    @Inject(UNIT_OF_WORK_DI_TOKEN)
    private readonly unitOfWork: IUnitOfWork,
    @Inject(OUTBOX_DI_TOKEN.REPOSITORY)
    private readonly outboxRepository: OutboxRepository,
  ) {}

  async execute(command: PasswordResetRequestCommand): Promise<void> {
    const user = await this.userRepository.findByEmail(
      Email.create(command.email),
    );

    if (!user) {
      throw new UserNotFoundException();
    }

    const generatedToken = this.tokenService.generatePasswordResetToken();
    const passwordResetToken = PasswordResetToken.create({
      userId: user.id,
      tokenHash: generatedToken.passwordResetTokenHash,
      expiresAt: generatedToken.expiresAt,
    });

    // Community emails the link on `user.password_reset_requested`.
    user.requestPasswordReset(
      generatedToken.rawPasswordResetToken,
      generatedToken.expiresAt,
    );

    await this.unitOfWork.run(async (context) => {
      await this.passwordResetTokenRepository.save(passwordResetToken, context);

      await this.outboxRepository.append(
        user
          .pullDomainEvents()
          .map((event) => OutboxMessage.fromDomainEvent(event)),
        context,
      );
    });
  }
}
