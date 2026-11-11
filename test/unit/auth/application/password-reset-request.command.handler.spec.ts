import { PasswordResetRequestCommand } from 'modules/auth/application/commands/password-reset-request/password-reset-request.command';
import { PasswordResetRequestCommandHandler } from 'modules/auth/application/commands/password-reset-request/password-reset-request.command.handler';
import { PasswordResetEmailComposerPort } from 'modules/auth/application/ports/password-reset-email-composer.port';
import { ITokenService } from 'modules/auth/application/ports/token-service.port';
import { IPasswordResetTokenRepository } from 'modules/auth/domain/repositories/password-reset-token.repository.interface';
import { UserNotFoundException } from 'modules/users/domain/exceptions/user-not-found.exception';
import { IUserRepository } from 'modules/users/domain/repositories/user.repository.interface';
import { User } from 'modules/users/domain/entities/user';
import { Email } from 'modules/users/domain/value-objects/email.vo';
import { Phone } from 'modules/users/domain/value-objects/phone.vo';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { UserStatus } from 'shared/domain/enums/user-status.enum';
import { IUnitOfWork } from 'shared/application/ports/unit-of-work.port';
import { TransactionContext } from 'shared/domain/repositories/transaction-context';
import { OutboxRepository } from 'modules/outbox/domain/repositories/outbox.repository';
import { generateUuid } from 'shared/domain/value-objects/uuid.vo';

function createUser() {
  return User.create({
    id: generateUuid(),
    name: 'Tenant One',
    email: Email.create('tenant@example.com'),
    phone: Phone.create('0912345678'),
    password: 'password-hash',
    role: UserRole.TENANT,
    status: UserStatus.ACTIVE,
  });
}

describe('PasswordResetRequestCommandHandler', () => {
  it('stores a hashed reset token and requests its email in the same transaction', async () => {
    const user = createUser();
    const context: TransactionContext = { kind: 'transaction' };
    const userRepository = {
      findByEmail: jest.fn(async (email: Email) => {
        expect(email.value).toBe('tenant@example.com');
        return user;
      }),
    } as unknown as IUserRepository;
    const resetTokenRepository = {
      save: jest.fn(async (_token, passedContext: TransactionContext) => {
        expect(passedContext).toBe(context);
      }),
    } as unknown as IPasswordResetTokenRepository;
    const tokenService = {
      generatePasswordResetToken: jest.fn(() => ({
        rawPasswordResetToken: 'raw-reset-token',
        passwordResetTokenHash: 'hashed-reset-token',
        expiresAt: new Date('2026-12-01T00:00:00.000Z'),
      })),
    } as unknown as ITokenService;
    const unitOfWork: IUnitOfWork = {
      run: jest.fn(async (work) => work(context)),
    };
    const outboxRepository = {
      append: jest.fn(async (_events, passedContext: TransactionContext) => {
        expect(passedContext).toBe(context);
      }),
    } as unknown as OutboxRepository;
    const emailComposer: PasswordResetEmailComposerPort = {
      compose: jest.fn(() => ({
        subject: 'Reset password',
        text: 'Reset token',
        html: '<p>Reset token</p>',
      })),
    };
    const handler = new PasswordResetRequestCommandHandler(
      userRepository,
      resetTokenRepository,
      tokenService,
      unitOfWork,
      outboxRepository,
      emailComposer,
    );

    await handler.execute(
      new PasswordResetRequestCommand(' TENANT@EXAMPLE.COM '),
    );

    expect(resetTokenRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: user.id,
        tokenHash: 'hashed-reset-token',
      }),
      context,
    );
    expect(emailComposer.compose).toHaveBeenCalledWith({
      name: user.name,
      token: 'raw-reset-token',
    });
    expect(outboxRepository.append).toHaveBeenCalledWith(
      [expect.objectContaining({ eventType: 'email.send_requested' })],
      context,
    );
  });

  it('does not create a token or start a transaction for an unknown user', async () => {
    const userRepository = {
      findByEmail: jest.fn(async () => null),
    } as unknown as IUserRepository;
    const tokenService = {
      generatePasswordResetToken: jest.fn(),
    } as unknown as ITokenService;
    const unitOfWork: IUnitOfWork = { run: jest.fn() };
    const handler = new PasswordResetRequestCommandHandler(
      userRepository,
      {} as IPasswordResetTokenRepository,
      tokenService,
      unitOfWork,
      {} as OutboxRepository,
      { compose: jest.fn() },
    );

    await expect(
      handler.execute(new PasswordResetRequestCommand('missing@example.com')),
    ).rejects.toThrow(UserNotFoundException);
    expect(tokenService.generatePasswordResetToken).not.toHaveBeenCalled();
    expect(unitOfWork.run).not.toHaveBeenCalled();
  });
});
