import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { BcryptUtils } from 'utils/bcrypt.utils';
import { LoginCommand } from '../implements/login.command';
import { AuthResult } from '../../results/auth.result';
import { USERS_DI_TOKEN } from '../../../../users/users.di-token';
import { UserRepository } from '../../../../users/domain/repositories/user.repository';
import { AUTH_DI_TOKEN } from '../../../auth.di-token';
import { AuthRepository } from '../../../domain/repositories/auth.repository';
import { TokenService } from '../../../infra/services/token.service';
import { UserStatus } from '../../../../users/domain/enums/user-status.enum';
import { RefreshTokenEntity } from '../../../infra/persistence/refresh-token.entity';
import { AccountLockedException } from '../../../domain/exceptions/account-locked.exception';
import { InvalidCredentialsException } from '../../../domain/exceptions/invalid-credentials.exception';

@CommandHandler(LoginCommand)
export class LoginCommandHandler implements ICommandHandler<
  LoginCommand,
  AuthResult
> {
  constructor(
    @Inject(USERS_DI_TOKEN.REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(AUTH_DI_TOKEN.REPOSITORY)
    private readonly authRepository: AuthRepository,
    private readonly tokenService: TokenService,
  ) {}

  async execute(command: LoginCommand): Promise<AuthResult> {
    const { identifier, password, rememberMe } = command;

    const user = await this.userRepository.findByIdentifier(identifier);
    if (!user) {
      throw new InvalidCredentialsException();
    }

    const isPasswordValid = await BcryptUtils.compare(password, user.password);
    if (!isPasswordValid) {
      throw new InvalidCredentialsException();
    }

    if (user.status === UserStatus.LOCKED) {
      throw new AccountLockedException(user.lockReason);
    }

    const accessToken = this.tokenService.generateAccessToken(
      user.id,
      user.role,
    );
    const { rawToken, tokenHash, expiresAt } =
      this.tokenService.generateRefreshToken(rememberMe);

    const refreshTokenEntity = new RefreshTokenEntity();
    refreshTokenEntity.userId = user.id;
    refreshTokenEntity.tokenHash = tokenHash;
    refreshTokenEntity.expiresAt = expiresAt;
    refreshTokenEntity.revokedAt = null;

    await this.authRepository.saveRefreshToken(refreshTokenEntity);

    return new AuthResult(accessToken, rawToken, user);
  }
}
