import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { RefreshTokenEntity } from './infra/persistence/refresh-token.entity';
import { AuthRepository } from './infra/persistence/auth.repository';
import { AUTH_DI_TOKEN } from './auth.di-token';
import { TokenService } from './infra/services/token.service';
import { AuthRegisterCommandHandler } from './use-case/commands/handlers/auth-register.command.handler';
import { AuthLoginCommandHandler } from './use-case/commands/handlers/auth-login.command.handler';
import { AuthController } from './presentation/controllers/auth.controller';
import { ApiConfigService } from 'shared/services/api-config.service';
import { JwtStrategy } from 'shared/strategies/jwt.strategy';
import { JwtAuthGuard } from 'shared/guards/jwt-auth.guard';
import { RolesGuard } from 'shared/guards/roles.guard';
import { RequestPasswordResetCommandHandler } from './use-case/commands/handlers/request-password-reset.command.handler';
import { PasswordResetTokenEntity } from './infra/persistence/password-reset-token.entity';
import { PasswordResetTokenRepository } from './infra/persistence/password-reset-token.repository';

import { AuthRevokeTokensOnUserEventsHandler } from './use-case/events/handlers/auth-revoke-tokens-on-user-events.event.handler';

const commandHandlers = [
  AuthRegisterCommandHandler,
  AuthLoginCommandHandler,
  RequestPasswordResetCommandHandler,
];
const eventHandlers = [AuthRevokeTokensOnUserEventsHandler];

@Module({
  imports: [
    CqrsModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ApiConfigService],
      useFactory: (configService: ApiConfigService) => ({
        secret: configService.jwtSecret,
        signOptions: { expiresIn: '15m' },
      }),
    }),
    TypeOrmModule.forFeature([RefreshTokenEntity, PasswordResetTokenEntity]),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [
    TokenService,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
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
  exports: [AUTH_DI_TOKEN.REPOSITORY, TokenService, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
