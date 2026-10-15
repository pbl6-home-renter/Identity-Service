import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { BcryptUtils } from 'utils/bcrypt.utils';
import { AuthLoginCommand } from '../implements/auth-login.command';
import { AuthResult } from '../../results/auth.result';
import { USERS_DI_TOKEN } from '../../../../users/users.di-token';
import { IUserRepository } from '../../../../users/domain/repositories/user.repository.interface';
import { AUTH_DI_TOKEN } from '../../../auth.di-token';
import { IAuthRepository } from '../../../domain/repositories/auth.repository.interface';
import { TokenService } from '../../../infra/services/token.service';
import { User } from '../../../../users/domain/entities/user';
import { RefreshToken } from '../../../domain/entities/refresh-token';
import { AuthLoginInvalidCredentialsException } from '../../../domain/exceptions/auth-login-invalid-credentials.exception';

@CommandHandler(AuthLoginCommand)
export class AuthLoginCommandHandler implements ICommandHandler<
  AuthLoginCommand,
  AuthResult
> {
  constructor(
    @Inject(USERS_DI_TOKEN.REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(AUTH_DI_TOKEN.REPOSITORY)
    private readonly authRepository: IAuthRepository,
    private readonly tokenService: TokenService,
  ) {}

  async execute(command: AuthLoginCommand): Promise<AuthResult> {
    const user = await this.validateCredentials(
      command.identifier,
      command.password,
    );
    const { accessToken, rawToken } = await this.issueTokens(
      user,
      command.rememberMe,
    );

    return AuthResult.create(accessToken, rawToken, user);
  }

  private async validateCredentials(
    identifier: string,
    plainPassword: string,
  ): Promise<User> {
    const user = await this.userRepository.findByIdentifier(identifier);
    if (!user) {
      throw new AuthLoginInvalidCredentialsException();
    }

    const isPasswordValid = await BcryptUtils.compare(
      plainPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new AuthLoginInvalidCredentialsException();
    }

    return user;
  }

  private async issueTokens(
    user: User,
    rememberMe: boolean,
  ): Promise<{ accessToken: string; rawToken: string }> {
    const { rawToken, tokenHash, expiresAt } =
      this.tokenService.generateRefreshToken(rememberMe);

    const refreshToken = RefreshToken.create({
      userId: user.id,
      tokenHash,
      expiresAt,
      revokedAt: null,
    });

    await this.authRepository.saveRefreshToken(refreshToken);
    const accessToken = this.tokenService.generateAccessToken(
      user.id,
      user.role,
    );
    return { accessToken, rawToken };
  }
}
