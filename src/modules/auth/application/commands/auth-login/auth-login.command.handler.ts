import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { IPasswordHasher } from 'modules/users/application/ports/password-hasher.port';
import { AuthLoginCommand } from './auth-login.command';
import { AuthResult } from '../../results/auth.result';
import { USERS_DI_TOKEN } from 'modules/users/users.di-token';
import { IUserRepository } from 'modules/users/domain/repositories/user.repository.interface';
import { AUTH_DI_TOKEN } from '../../../auth.di-token';
import { IAuthRepository } from '../../../domain/repositories/auth.repository.interface';
import { ITokenService } from '../../ports/token-service.port';
import { User } from 'modules/users/domain/entities/user';
import { Email } from 'modules/users/domain/value-objects/email.vo';
import { Phone } from 'modules/users/domain/value-objects/phone.vo';
import { InvalidEmailException } from 'modules/users/domain/exceptions/invalid-email.exception';
import { InvalidPhoneException } from 'modules/users/domain/exceptions/invalid-phone.exception';
import { RefreshToken } from '../../../domain/entities/refresh-token';
import { AuthLoginInvalidCredentialsException } from '../../../domain/exceptions/auth-login-invalid-credentials.exception';

@CommandHandler(AuthLoginCommand)
export class AuthLoginCommandHandler implements ICommandHandler<
  AuthLoginCommand,
  AuthResult
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
  ) {}

  async execute(command: AuthLoginCommand): Promise<AuthResult> {
    const user = await this.validateCredentials(
      command.identifier,
      command.password,
    );
    const { accessToken, rawRefreshToken } = await this.issueTokens(
      user,
      command.rememberMe,
    );

    return AuthResult.create(accessToken, rawRefreshToken, user);
  }

  private async validateCredentials(
    identifier: string,
    plainPassword: string,
  ): Promise<User> {
    const user = await this.findByIdentifier(identifier);
    if (!user) {
      throw new AuthLoginInvalidCredentialsException();
    }

    const isPasswordValid = await this.passwordHasher.compare(
      plainPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new AuthLoginInvalidCredentialsException();
    }

    return user;
  }

  private async findByIdentifier(identifier: string): Promise<User | null> {
    let lookup: Email | Phone;
    try {
      lookup = identifier.includes('@')
        ? Email.create(identifier)
        : Phone.create(identifier);
    } catch (error) {
      if (
        error instanceof InvalidEmailException ||
        error instanceof InvalidPhoneException
      ) {
        return null;
      }

      throw error;
    }

    return lookup instanceof Email
      ? this.userRepository.findByEmail(lookup)
      : this.userRepository.findByPhone(lookup);
  }

  private async issueTokens(
    user: User,
    rememberMe: boolean,
  ): Promise<{ accessToken: string; rawRefreshToken: string }> {
    const { rawRefreshToken, refreshTokenHash, expiresAt } =
      this.tokenService.generateRefreshToken(rememberMe);

    const refreshToken = RefreshToken.create({
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt,
      revokedAt: null,
    });

    await this.authRepository.saveRefreshToken(refreshToken);

    const accessToken = await this.tokenService.generateAccessToken(
      user.id,
      user.role,
      user.status,
    );

    return { accessToken, rawRefreshToken };
  }
}
