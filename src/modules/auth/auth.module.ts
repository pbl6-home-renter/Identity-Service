import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { RefreshTokenEntity } from './infra/persistence/refresh-token.entity';
import { AuthRepository } from './infra/persistence/auth.repository';
import { AUTH_DI_TOKEN } from './auth.di-token';
import { TokenService } from './infra/services/token.service';
import { AuthRegisterCommandHandler } from './use-case/commands/handlers/auth-register.command.handler';
import { AuthLoginCommandHandler } from './use-case/commands/handlers/auth-login.command.handler';
import { AuthController } from './presentation/controllers/auth.controller';
import { RequestPasswordResetCommandHandler } from './use-case/commands/handlers/request-password-reset.command.handler';
import { PasswordResetTokenEntity } from './infra/persistence/password-reset-token.entity';
import { PasswordResetTokenRepository } from './infra/persistence/password-reset-token.repository';
import { ResetPasswordCommandHandler } from './use-case/commands/handlers/reset-password.command.handler';
import { JwksController } from './presentation/controllers/jwks.controller';
import { AuthRefreshCommandHandler } from './use-case/commands/handlers/auth-refresh.command.handler';
import { AuthLogoutCommandHandler } from './use-case/commands/handlers/auth-logout.command.handler';

import { AuthRevokeTokensOnUserEventsHandler } from './use-case/events/handlers/auth-revoke-tokens-on-user-events.event.handler';

const commandHandlers = [
  AuthRegisterCommandHandler,
  AuthLoginCommandHandler,
  AuthRefreshCommandHandler,
  AuthLogoutCommandHandler,
  RequestPasswordResetCommandHandler,
  ResetPasswordCommandHandler,
];
const eventHandlers = [AuthRevokeTokensOnUserEventsHandler];

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([RefreshTokenEntity, PasswordResetTokenEntity]),
    UsersModule,
  ],
  controllers: [AuthController, JwksController],
  providers: [
    TokenService,
    {
      provide: AUTH_DI_TOKEN.TOKEN_SERVICE,
      useExisting: TokenService,
    },
    {
      provide: AUTH_DI_TOKEN.REPOSITORY,
      useClass: AuthRepository,
    },
    {
      provide: AUTH_DI_TOKEN.PASSWORD_RESET_TOKEN_REPOSITORY,
      useClass: PasswordResetTokenRepository,
    },
    ...commandHandlers,
    ...eventHandlers,
  ],
  exports: [AUTH_DI_TOKEN.REPOSITORY, AUTH_DI_TOKEN.TOKEN_SERVICE],
})
export class AuthModule {}
