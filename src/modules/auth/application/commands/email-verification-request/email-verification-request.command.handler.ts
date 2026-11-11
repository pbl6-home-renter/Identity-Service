import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { USERS_DI_TOKEN } from 'modules/users/users.di-token';
import { IUserRepository } from 'modules/users/domain/repositories/user.repository.interface';
import { Email } from 'modules/users/domain/value-objects/email.vo';
import { UserStatus } from 'shared/domain/enums/user-status.enum';
import { UNIT_OF_WORK_DI_TOKEN } from 'shared/application/di-tokens';
import { IUnitOfWork } from 'shared/application/ports/unit-of-work.port';
import { OUTBOX_DI_TOKEN } from 'modules/outbox/outbox.di-token';
import { OutboxRepository } from 'modules/outbox/domain/repositories/outbox.repository';
import { OutboxMessage } from 'modules/outbox/domain/entities/outbox-message.entity';
import { EmailSendRequestedEvent } from '../../events/email-send-requested.event';
import { AUTH_DI_TOKEN } from '../../../auth.di-token';
import { IAuthRepository } from '../../../domain/repositories/auth.repository.interface';
import { ITokenService } from '../../ports/token-service.port';
import { EmailVerificationEmailComposerPort } from '../../ports/email-verification-email-composer.port';
import { EmailVerificationRequestCommand } from './email-verification-request.command';

@CommandHandler(EmailVerificationRequestCommand)
export class EmailVerificationRequestCommandHandler implements ICommandHandler<
  EmailVerificationRequestCommand,
  void
> {
  constructor(
    @Inject(USERS_DI_TOKEN.REPOSITORY)
    private readonly users: IUserRepository,
    @Inject(AUTH_DI_TOKEN.REPOSITORY)
    private readonly authRepository: IAuthRepository,
    @Inject(AUTH_DI_TOKEN.TOKEN_SERVICE)
    private readonly tokenService: ITokenService,
    @Inject(UNIT_OF_WORK_DI_TOKEN)
    private readonly unitOfWork: IUnitOfWork,
    @Inject(OUTBOX_DI_TOKEN.REPOSITORY)
    private readonly outboxRepository: OutboxRepository,
    @Inject(AUTH_DI_TOKEN.EMAIL_VERIFICATION_EMAIL_COMPOSER)
    private readonly emailComposer: EmailVerificationEmailComposerPort,
  ) {}

  async execute(command: EmailVerificationRequestCommand): Promise<void> {
    const user = await this.users.findByEmail(Email.create(command.email));
    if (!user || user.status !== UserStatus.PENDING_VERIFICATION) return;

    const generatedToken = this.tokenService.generateEmailVerificationToken();
    const content = this.emailComposer.compose({
      name: user.name,
      token: generatedToken.rawToken,
    });
    const emailRequested = new EmailSendRequestedEvent(
      user.email.value,
      content.subject,
      content.text,
      content.html,
    );

    await this.unitOfWork.run(async (context) => {
      await this.authRepository.invalidateEmailVerificationTokens(
        user.id,
        context,
      );
      await this.authRepository.saveEmailVerificationToken(
        {
          userId: user.id,
          tokenHash: generatedToken.tokenHash,
          expiresAt: generatedToken.expiresAt,
        },
        context,
      );
      await this.outboxRepository.append(
        [OutboxMessage.fromDomainEvent(emailRequested)],
        context,
      );
    });
  }
}
