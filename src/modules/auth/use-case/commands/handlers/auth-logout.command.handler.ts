import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AUTH_DI_TOKEN } from '../../../auth.di-token';
import { IAuthRepository } from '../../../domain/repositories/auth.repository.interface';
import { ITokenService } from '../../../domain/services/token.service.interface';
import { AuthLogoutCommand } from '../implements/auth-logout.command';

@CommandHandler(AuthLogoutCommand)
export class AuthLogoutCommandHandler implements ICommandHandler<AuthLogoutCommand> {
  constructor(
    @Inject(AUTH_DI_TOKEN.REPOSITORY)
    private readonly authRepository: IAuthRepository,
    @Inject(AUTH_DI_TOKEN.TOKEN_SERVICE)
    private readonly tokenService: ITokenService,
  ) {}

  async execute(command: AuthLogoutCommand): Promise<void> {
    await this.authRepository.revokeRefreshTokenFamily(
      this.tokenService.hashRefreshToken(command.refreshToken),
      command.userId,
    );
  }
}
