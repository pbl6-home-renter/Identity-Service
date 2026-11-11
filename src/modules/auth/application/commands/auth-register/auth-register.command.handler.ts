import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { IPasswordHasher } from 'modules/users/application/ports/password-hasher.port';
import { AuthRegisterCommand } from './auth-register.command';
import { USERS_DI_TOKEN } from 'modules/users/users.di-token';
import { IUserRepository } from 'modules/users/domain/repositories/user.repository.interface';
import { AUTH_DI_TOKEN } from '../../../auth.di-token';
import { IAuthRepository } from '../../../domain/repositories/auth.repository.interface';
import { ITokenService } from '../../ports/token-service.port';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { UserStatus } from 'shared/domain/enums/user-status.enum';
import { User } from 'modules/users/domain/entities/user';
import { Email } from 'modules/users/domain/value-objects/email.vo';
import { Phone } from 'modules/users/domain/value-objects/phone.vo';
import { EmailAlreadyExistsException } from 'modules/users/domain/exceptions/email-already-exists.exception';
import { PhoneAlreadyExistsException } from 'modules/users/domain/exceptions/phone-already-exists.exception';
import { AuthRegisterRoleNotAllowedException } from '../../../domain/exceptions/auth-register-role-not-allowed.exception';
import { UNIT_OF_WORK_DI_TOKEN } from 'shared/application/di-tokens';
import { IUnitOfWork } from 'shared/application/ports/unit-of-work.port';
import { OUTBOX_DI_TOKEN } from 'modules/outbox/outbox.di-token';
import { OutboxRepository } from 'modules/outbox/domain/repositories/outbox.repository';
import { OutboxMessage } from 'modules/outbox/domain/entities/outbox-message.entity';
import { EmailSendRequestedEvent } from '../../events/email-send-requested.event';
import { EmailVerificationEmailComposerPort } from '../../ports/email-verification-email-composer.port';

@CommandHandler(AuthRegisterCommand)
export class AuthRegisterCommandHandler implements ICommandHandler<
  AuthRegisterCommand,
  User
> {
  constructor(
    @Inject(USERS_DI_TOKEN.PASSWORD_HASHER)
    private readonly passwordHasher: IPasswordHasher,
    @Inject(USERS_DI_TOKEN.REPOSITORY)
    private readonly userRepository: IUserRepository,
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

  async execute(command: AuthRegisterCommand): Promise<User> {
    this.validateRole(command.role);
    const email = Email.create(command.email);
    const phone = Phone.create(command.phone);
    await this.validateUniqueCredentials(email, phone);

    const user = await this.buildUser(command, email, phone);
    const generatedToken = this.tokenService.generateEmailVerificationToken();
    const verificationEmail = this.emailComposer.compose({
      name: user.name,
      token: generatedToken.rawToken,
    });
    const emailRequested = new EmailSendRequestedEvent(
      user.email.value,
      verificationEmail.subject,
      verificationEmail.text,
      verificationEmail.html,
    );

    await this.unitOfWork.run(async (context) => {
      await this.userRepository.save(user, context);

      await this.authRepository.saveEmailVerificationToken(
        {
          userId: user.id,
          tokenHash: generatedToken.tokenHash,
          expiresAt: generatedToken.expiresAt,
        },
        context,
      );

      await this.outboxRepository.append(
        [
          ...user
            .pullDomainEvents()
            .map((event) => OutboxMessage.fromDomainEvent(event)),
          OutboxMessage.fromDomainEvent(emailRequested),
        ],
        context,
      );
    });

    return user;
  }

  private validateRole(role: UserRole): void {
    if (role === UserRole.ADMIN) {
      throw new AuthRegisterRoleNotAllowedException(role);
    }
  }

  private async validateUniqueCredentials(
    email: Email,
    phone: Phone,
  ): Promise<void> {
    const existingByEmail = await this.userRepository.findByEmail(email);
    if (existingByEmail) {
      throw new EmailAlreadyExistsException(email.value);
    }

    const existingByPhone = await this.userRepository.findByPhone(phone);
    if (existingByPhone) {
      throw new PhoneAlreadyExistsException(phone.value);
    }
  }

  private async buildUser(
    command: AuthRegisterCommand,
    email: Email,
    phone: Phone,
  ): Promise<User> {
    const hashedPassword = await this.passwordHasher.hash(command.password);

    return User.register({
      name: command.name,
      email,
      phone,
      password: hashedPassword,
      role: command.role,
      status: UserStatus.PENDING_VERIFICATION,
      lockReason: null,
      lockedAt: null,
    });
  }
}
