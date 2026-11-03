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
import { PasswordResetEmailComposerPort } from '../../ports/password-reset-email-composer.port';
import { EmailSendRequestedEvent } from '../../events/email-send-requested.event';

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
    @Inject(AUTH_DI_TOKEN.PASSWORD_RESET_EMAIL_COMPOSER)
    private readonly emailComposer: PasswordResetEmailComposerPort,
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

    const email = this.emailComposer.compose({
      name: user.name,
      token: generatedToken.rawPasswordResetToken,
    });
    const emailRequested = new EmailSendRequestedEvent(
      user.email.value,
      email.subject,
      email.text,
      email.html,
    );

    await this.unitOfWork.run(async (context) => {
      await this.passwordResetTokenRepository.save(passwordResetToken, context);

      await this.outboxRepository.append(
        [OutboxMessage.fromDomainEvent(emailRequested)],
        context,
      );
    });
  }
}
