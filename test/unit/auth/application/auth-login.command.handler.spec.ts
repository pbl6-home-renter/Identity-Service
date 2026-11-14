import { AuthLoginCommand } from 'modules/auth/application/commands/auth-login/auth-login.command';
import { AuthLoginCommandHandler } from 'modules/auth/application/commands/auth-login/auth-login.command.handler';
import { EmailNotVerifiedException } from 'modules/auth/domain/exceptions/email-not-verified.exception';
import { AuthLoginInvalidCredentialsException } from 'modules/auth/domain/exceptions/auth-login-invalid-credentials.exception';
import { IAuthRepository } from 'modules/auth/domain/repositories/auth.repository.interface';
import { RefreshToken } from 'modules/auth/domain/entities/refresh-token';
import { IUserRepository } from 'modules/users/domain/repositories/user.repository.interface';
import { IPasswordHasher } from 'modules/users/application/ports/password-hasher.port';
import { ITokenService } from 'modules/auth/application/ports/token-service.port';
import { User } from 'modules/users/domain/entities/user';
import { Email } from 'modules/users/domain/value-objects/email.vo';
import { Phone } from 'modules/users/domain/value-objects/phone.vo';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { UserStatus } from 'shared/domain/enums/user-status.enum';
import { generateUuid } from 'shared/domain/value-objects/uuid.vo';

function createUser(status = UserStatus.ACTIVE): User {
  return User.create({
    id: generateUuid(),
    name: 'Tenant One',
    email: Email.create('tenant@example.com'),
    phone: Phone.create('0912345678'),
    password: 'hashed-password',
    role: UserRole.TENANT,
    status,
  });
}

function createTokenService(): ITokenService {
  return {
    generateAccessToken: jest.fn(async () => 'access-token'),
    generateRefreshToken: jest.fn(() => ({
      rawRefreshToken: 'raw-refresh-token',
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

function createUserRepository(user: User | null): IUserRepository {
  return {
    save: jest.fn(async () => undefined),
    findById: jest.fn(async () => user),
    findByIdForUpdate: jest.fn(async () => user),
    delete: jest.fn(async () => undefined),
    updatePassword: jest.fn(async () => undefined),
    findByIdIncludingDeleted: jest.fn(async () => user),
    findByEmail: jest.fn(async () => user),
    findByPhone: jest.fn(async () => user),
  };
}

function createAuthRepository(): IAuthRepository {
  return {
    saveEmailVerificationToken: jest.fn(async () => undefined),
    invalidateEmailVerificationTokens: jest.fn(async () => undefined),
    verifyEmailWithToken: jest.fn(async () => createUser()),
    saveRefreshToken: jest.fn(async () => undefined),
    rotateRefreshToken: jest.fn(async () => ({ outcome: 'invalid' as const })),
    revokeRefreshTokenFamily: jest.fn(async () => undefined),
    revokeActiveRefreshTokensByUserId: jest.fn(async () => undefined),
    resetPasswordWithToken: jest.fn(async () => undefined),
  };
}

describe('AuthLoginCommandHandler', () => {
  it('finds by normalized email and issues a refresh and access token', async () => {
    const user = createUser();
    const passwordHasher: IPasswordHasher = {
      hash: jest.fn(async () => 'new-hash'),
      compare: jest.fn(async () => true),
    };
    const userRepository = createUserRepository(user);
    const authRepository = createAuthRepository();
    const tokenService = createTokenService();
    const handler = new AuthLoginCommandHandler(
      passwordHasher,
      userRepository,
      authRepository,
      tokenService,
    );

    const result = await handler.execute(
      new AuthLoginCommand(' TENANT@EXAMPLE.COM ', 'password', false),
    );

    expect(userRepository.findByEmail).toHaveBeenCalledWith(
      Email.create('tenant@example.com'),
    );
    expect(tokenService.generateRefreshToken).toHaveBeenCalledWith(false);
    expect(authRepository.saveRefreshToken).toHaveBeenCalledWith(
      expect.any(RefreshToken),
    );
    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('raw-refresh-token');
    expect(result.user).toBe(user);
  });

  it('returns the same credential error when the account is missing or the password is wrong', async () => {
    const passwordHasher: IPasswordHasher = {
      hash: jest.fn(async () => 'new-hash'),
      compare: jest.fn(async () => false),
    };
    const handler = new AuthLoginCommandHandler(
      passwordHasher,
      createUserRepository(createUser()),
      createAuthRepository(),
      createTokenService(),
    );

    await expect(
      handler.execute(new AuthLoginCommand('tenant@example.com', 'wrong')),
    ).rejects.toThrow(AuthLoginInvalidCredentialsException);
  });

  it('does not issue tokens for an account awaiting email verification', async () => {
    const tokenService = createTokenService();
    const handler = new AuthLoginCommandHandler(
      {
        hash: jest.fn(async () => 'new-hash'),
        compare: jest.fn(async () => true),
      },
      createUserRepository(createUser(UserStatus.PENDING_VERIFICATION)),
      createAuthRepository(),
      tokenService,
    );

    await expect(
      handler.execute(new AuthLoginCommand('tenant@example.com', 'password')),
    ).rejects.toThrow(EmailNotVerifiedException);
    expect(tokenService.generateRefreshToken).not.toHaveBeenCalled();
  });

  it('treats malformed identifiers as invalid credentials without repository lookup', async () => {
    const userRepository = createUserRepository(null);
    const handler = new AuthLoginCommandHandler(
      {
        hash: jest.fn(async () => 'new-hash'),
        compare: jest.fn(async () => true),
      },
      userRepository,
      createAuthRepository(),
      createTokenService(),
    );

    await expect(
      handler.execute(new AuthLoginCommand('not-a-phone', 'password')),
    ).rejects.toThrow(AuthLoginInvalidCredentialsException);
    expect(userRepository.findByEmail).not.toHaveBeenCalled();
    expect(userRepository.findByPhone).not.toHaveBeenCalled();
  });
});
