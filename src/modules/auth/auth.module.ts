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
import { RegisterCommandHandler } from './use-case/commands/handlers/register.command.handler';
import { LoginCommandHandler } from './use-case/commands/handlers/login.command.handler';
import { AuthController } from './presentation/controllers/auth.controller';
import { ApiConfigService } from 'shared/services/api-config.service';
import { JwtStrategy } from 'shared/strategies/jwt.strategy';
import { JwtAuthGuard } from 'shared/guards/jwt-auth.guard';
import { RolesGuard } from 'shared/guards/roles.guard';
import { RequestPasswordResetCommandHandler } from './use-case/commands/handlers/request-password-reset.command.handler';
import { PasswordResetTokenEntity } from './infra/persistence/password-reset-token.entity';
import { PasswordResetTokenRepository } from './infra/persistence/password-reset-token.repository';

const commandHandlers = [
  RegisterCommandHandler,
  LoginCommandHandler,
  RequestPasswordResetCommandHandler,
];

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
  ],
  exports: [AUTH_DI_TOKEN.REPOSITORY, TokenService, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
