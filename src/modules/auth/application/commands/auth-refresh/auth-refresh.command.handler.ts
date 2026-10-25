import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { USERS_DI_TOKEN } from 'modules/users/users.di-token';
import { IUserRepository } from 'modules/users/domain/repositories/user.repository.interface';
import { AUTH_DI_TOKEN } from '../../../auth.di-token';
import { IAuthRepository } from '../../../domain/repositories/auth.repository.interface';
import { InvalidRefreshTokenException } from '../../../domain/exceptions/invalid-refresh-token.exception';
import { RefreshTokenReusedException } from '../../../domain/exceptions/refresh-token-reused.exception';
import { ITokenService } from '../../ports/token-service.port';
import { AuthRefreshResult } from '../../results/auth-refresh.result';
import { AuthRefreshCommand } from './auth-refresh.command';

@CommandHandler(AuthRefreshCommand)
export class AuthRefreshCommandHandler implements ICommandHandler<
  AuthRefreshCommand,
  AuthRefreshResult
> {
  constructor(
    @Inject(USERS_DI_TOKEN.REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(AUTH_DI_TOKEN.REPOSITORY)
    private readonly authRepository: IAuthRepository,
    @Inject(AUTH_DI_TOKEN.TOKEN_SERVICE)
    private readonly tokenService: ITokenService,
  ) {}

  async execute(command: AuthRefreshCommand): Promise<AuthRefreshResult> {
    const successor = this.tokenService.generateOpaqueRefreshToken();
    const rotation = await this.authRepository.rotateRefreshToken(
      this.tokenService.hashRefreshToken(command.refreshToken),
      successor.refreshTokenHash,
      new Date(),
    );

    if (rotation.outcome === 'reused') {
      throw new RefreshTokenReusedException();
    }

    if (rotation.outcome === 'invalid') {
      throw new InvalidRefreshTokenException();
    }

    const user = await this.userRepository.findById(rotation.userId);
    if (!user) {
      throw new InvalidRefreshTokenException();
    }

    const accessToken = await this.tokenService.generateAccessToken(
      user.id,
      user.role,
      user.status,
    );

    return AuthRefreshResult.create(accessToken, successor.rawRefreshToken);
  }
}
