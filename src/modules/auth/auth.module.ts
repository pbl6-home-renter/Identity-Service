import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from 'modules/users/users.module';
import { OutboxModule } from 'modules/outbox/outbox.module';
import { RefreshTokenEntity } from './infrastructure/persistence/refresh-token.typeorm-entity';
import { AuthRepository } from './infrastructure/persistence/auth.repository';
import { AUTH_DI_TOKEN } from './auth.di-token';
import { TokenService } from './infrastructure/services/token.service';
import { JwtConfigService } from './infrastructure/config/jwt-config.service';
import { AuthRegisterCommandHandler } from './application/commands/auth-register/auth-register.command.handler';
import { AuthLoginCommandHandler } from './application/commands/auth-login/auth-login.command.handler';
import { AuthController } from './presentation/http/controllers/auth.controller';
import { PasswordResetRequestCommandHandler } from './application/commands/password-reset-request/password-reset-request.command.handler';
import { PasswordResetTokenEntity } from './infrastructure/persistence/password-reset-token.typeorm-entity';
import { PasswordResetTokenRepository } from './infrastructure/persistence/password-reset-token.repository';
import { PasswordResetConfirmCommandHandler } from './application/commands/password-reset-confirm/password-reset-confirm.command.handler';
import { JwksController } from './presentation/http/controllers/jwks.controller';
import { AuthRefreshCommandHandler } from './application/commands/auth-refresh/auth-refresh.command.handler';
import { AuthLogoutCommandHandler } from './application/commands/auth-logout/auth-logout.command.handler';

import { AuthRevokeTokensOnUserEventsHandler } from './application/event-handlers/auth-revoke-tokens-on-user-events.event.handler';

const commandHandlers = [
  AuthRegisterCommandHandler,
  AuthLoginCommandHandler,
  AuthRefreshCommandHandler,
  AuthLogoutCommandHandler,
  PasswordResetRequestCommandHandler,
  PasswordResetConfirmCommandHandler,
];
const eventHandlers = [AuthRevokeTokensOnUserEventsHandler];

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([RefreshTokenEntity, PasswordResetTokenEntity]),
    UsersModule,
    OutboxModule,
  ],
  controllers: [AuthController, JwksController],
  providers: [
    JwtConfigService,
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
