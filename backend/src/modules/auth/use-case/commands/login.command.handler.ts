import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { LoginCommand } from './login.command';
import { AuthResultVo } from '../../domain/value-objects/auth-result.vo';
import { USERS_DI_TOKEN } from '../../../users/users.di-token';
import { UserRepository } from '../../../users/domain/repositories/user.repository';
import { AUTH_DI_TOKEN } from '../../auth.di-token';
import { AuthRepository } from '../../domain/repositories/auth.repository';
import { TokenService } from '../../infra/services/token.service';
import { UserStatus } from '../../../users/domain/enums/user-status.enum';
import { RefreshTokenEntity } from '../../infra/persistence/refresh-token.entity';
import {
  AccountLockedException,
  InvalidCredentialsException,
} from '../../domain/exceptions/auth.exceptions';

@CommandHandler(LoginCommand)
export class LoginCommandHandler implements ICommandHandler<
  LoginCommand,
  AuthResultVo
> {
  constructor(
    @Inject(USERS_DI_TOKEN.REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(AUTH_DI_TOKEN.REPOSITORY)
    private readonly authRepository: AuthRepository,
    private readonly tokenService: TokenService,
  ) {}

  async execute(command: LoginCommand): Promise<AuthResultVo> {
    const { identifier, password, rememberMe } = command;

    // 1. Find user by email or phone (with is_deleted = false)
    const user = await this.userRepository.findByIdentifier(identifier);
    if (!user) {
      throw new InvalidCredentialsException();
    }

    // 2. Compare password with bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new InvalidCredentialsException();
    }

    // 3. Check account locked status
    if (user.status === UserStatus.LOCKED) {
      throw new AccountLockedException(user.lockReason);
    }

    // 4. Generate tokens
    const accessToken = this.tokenService.generateAccessToken(
      user.id,
      user.role,
    );
    const { rawToken, tokenHash, expiresAt } =
      this.tokenService.generateRefreshToken(rememberMe);

    // 5. Save refresh token hash into DB
    const refreshTokenEntity = new RefreshTokenEntity();
    refreshTokenEntity.userId = user.id;
    refreshTokenEntity.tokenHash = tokenHash;
    refreshTokenEntity.expiresAt = expiresAt;
    refreshTokenEntity.revokedAt = null;

    await this.authRepository.saveRefreshToken(refreshTokenEntity);

    return new AuthResultVo(accessToken, rawToken, user);
  }
}
