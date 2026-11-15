import { AuthRegisterCommand } from 'modules/auth/application/commands/auth-register/auth-register.command';
import { AuthRegisterCommandHandler } from 'modules/auth/application/commands/auth-register/auth-register.command.handler';
import { EmailVerificationEmailComposerPort } from 'modules/auth/application/ports/email-verification-email-composer.port';
import { ITokenService } from 'modules/auth/application/ports/token-service.port';
import { EMAIL_SEND_REQUESTED_EVENT } from 'modules/auth/application/events/email-send-requested.event.constants';
import { EmailAlreadyExistsException } from 'modules/users/domain/exceptions/email-already-exists.exception';
import { AuthRegisterRoleNotAllowedException } from 'modules/auth/domain/exceptions/auth-register-role-not-allowed.exception';
import { IAuthRepository } from 'modules/auth/domain/repositories/auth.repository.interface';
import { IUserRepository } from 'modules/users/domain/repositories/user.repository.interface';
import { IPasswordHasher } from 'modules/users/application/ports/password-hasher.port';
import { User } from 'modules/users/domain/entities/user';
import { Email } from 'modules/users/domain/value-objects/email.vo';
import { Phone } from 'modules/users/domain/value-objects/phone.vo';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { UserStatus } from 'shared/domain/enums/user-status.enum';
import { IUnitOfWork } from 'shared/application/ports/unit-of-work.port';
import { TransactionContext } from 'shared/domain/repositories/transaction-context';
import { OutboxRepository } from 'modules/outbox/domain/repositories/outbox.repository';
import { generateUuid } from 'shared/domain/value-objects/uuid.vo';

function createUserRepository(existing: User | null): IUserRepository {
  return {
    save: jest.fn(async () => undefined),
    findById: jest.fn(async () => null),
    findByIdForUpdate: jest.fn(async () => null),
    delete: jest.fn(async () => undefined),
    updatePassword: jest.fn(async () => undefined),
    findByIdIncludingDeleted: jest.fn(async () => null),
    findByEmail: jest.fn(async () => existing),
    findByPhone: jest.fn(async () => null),
  };
}

function createAuthRepository(): IAuthRepository {
  return {
    saveEmailVerificationToken: jest.fn(async () => undefined),
    invalidateEmailVerificationTokens: jest.fn(async () => undefined),
    verifyEmailWithToken: jest.fn(async () => {
      throw new Error('Not used by this use case');
    }),
    saveRefreshToken: jest.fn(async () => undefined),
    rotateRefreshToken: jest.fn(async () => ({ outcome: 'invalid' as const })),
    revokeRefreshTokenFamily: jest.fn(async () => undefined),
    revokeActiveRefreshTokensByUserId: jest.fn(async () => undefined),
    resetPasswordWithToken: jest.fn(async () => undefined),
  };
}

function createOutboxRepository(): OutboxRepository {
  return {
    append: jest.fn(async () => undefined),
    claimBatch: jest.fn(async () => []),
    saveClaimOutcome: jest.fn(async () => true),
    reclaimStale: jest.fn(async () => 0),
    requeueFailed: jest.fn(async () => true),
    purgePublished: jest.fn(async () => 0),
  };
}

function createTokenService(): ITokenService {
  return {
    generateAccessToken: jest.fn(async () => 'access-token'),
    generateRefreshToken: jest.fn(() => ({
      rawRefreshToken: 'refresh-token',
      refreshTokenHash: 'refresh-hash',
      expiresAt: new Date('2030-01-01T00:00:00.000Z'),
    })),
    generateOpaqueRefreshToken: jest.fn(() => ({
      rawRefreshToken: 'opaque-token',
      refreshTokenHash: 'opaque-hash',
    })),
    hashRefreshToken: jest.fn(() => 'refresh-hash'),
    generatePasswordResetToken: jest.fn(() => ({
      rawPasswordResetToken: 'reset-token',
      passwordResetTokenHash: 'reset-hash',
      expiresAt: new Date('2030-01-01T00:00:00.000Z'),
    })),
    hashPasswordResetToken: jest.fn(() => 'reset-hash'),
    generateEmailVerificationToken: jest.fn(() => ({
      rawToken: 'verification-token',
      tokenHash: 'verification-hash',
      expiresAt: new Date('2030-01-01T00:00:00.000Z'),
    })),
    hashEmailVerificationToken: jest.fn(() => 'verification-hash'),
  };
}

function createUnitOfWork(context: TransactionContext): IUnitOfWork {
  return {
    run<T>(work: (transaction: TransactionContext) => Promise<T>): Promise<T> {
      return work(context);
    },
  };
}

function createHandler(input: {
  existingUser?: User | null;
  context: TransactionContext;
  passwordHasher?: IPasswordHasher;
}) {
  const passwordHasher = input.passwordHasher ?? {
    hash: jest.fn(async () => 'hashed-password'),
    compare: jest.fn(async () => true),
  };
  const userRepository = createUserRepository(input.existingUser ?? null);
  const authRepository = createAuthRepository();
  const outboxRepository = createOutboxRepository();
  const tokenService = createTokenService();
  const emailComposer: EmailVerificationEmailComposerPort = {
    compose: jest.fn(() => ({
      subject: 'Verify your email',
      text: 'Verification token',
      html: '<p>Verification token</p>',
    })),
  };
  const handler = new AuthRegisterCommandHandler(
    passwordHasher,
    userRepository,
    authRepository,
    tokenService,
    createUnitOfWork(input.context),
    outboxRepository,
    emailComposer,
  );

  return { handler, userRepository, authRepository, outboxRepository };
}

describe('AuthRegisterCommandHandler', () => {
  it('normalizes credentials, hashes the password, and writes verification plus outbox atomically', async () => {
    const context: TransactionContext = { kind: 'transaction' };
    const { handler, userRepository, authRepository, outboxRepository } =
      createHandler({ context });

    const user = await handler.execute(
      new AuthRegisterCommand(
        'Tenant One',
        ' TENANT@EXAMPLE.COM ',
        '+84912345678',
        'plain-password',
        UserRole.TENANT,
      ),
    );

    expect(user.email.value).toBe('tenant@example.com');
    expect(user.phone.value).toBe('0912345678');
    expect(user.status).toBe(UserStatus.PENDING_VERIFICATION);
    expect(userRepository.save).toHaveBeenCalledWith(user, context);
    expect(authRepository.saveEmailVerificationToken).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: user.id,
        tokenHash: 'verification-hash',
      }),
      context,
    );
    expect(outboxRepository.append).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ eventType: 'user.registered' }),
        expect.objectContaining({ eventType: EMAIL_SEND_REQUESTED_EVENT }),
      ]),
      context,
    );
  });

  it('rejects a duplicate email before hashing or writing', async () => {
    const existingUser = User.create({
      id: generateUuid(),
      name: 'Existing',
      email: Email.create('tenant@example.com'),
      phone: Phone.create('0912345678'),
      password: 'hash',
      role: UserRole.TENANT,
      status: UserStatus.ACTIVE,
    });
    const passwordHasher: IPasswordHasher = {
      hash: jest.fn(async () => 'hashed-password'),
      compare: jest.fn(async () => true),
    };
    const { handler, userRepository, outboxRepository } = createHandler({
      existingUser,
      context: { kind: 'transaction' },
      passwordHasher,
    });

    await expect(
      handler.execute(
        new AuthRegisterCommand(
          'Tenant One',
          'tenant@example.com',
          '0987654321',
          'plain-password',
          UserRole.TENANT,
        ),
      ),
    ).rejects.toThrow(EmailAlreadyExistsException);
    expect(passwordHasher.hash).not.toHaveBeenCalled();
    expect(userRepository.save).not.toHaveBeenCalled();
    expect(outboxRepository.append).not.toHaveBeenCalled();
  });

  it('does not allow public registration as an administrator', async () => {
    const { handler, userRepository } = createHandler({
      context: { kind: 'transaction' },
    });

    await expect(
      handler.execute(
        new AuthRegisterCommand(
          'Admin',
          'admin@example.com',
          '0912345678',
          'password',
          UserRole.ADMIN,
        ),
      ),
    ).rejects.toThrow(AuthRegisterRoleNotAllowedException);
    expect(userRepository.findByEmail).not.toHaveBeenCalled();
  });
});
