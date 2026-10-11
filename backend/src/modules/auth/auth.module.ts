import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { RefreshTokenEntity } from './infra/persistence/refresh-token.entity';
import { AuthRepository } from './infra/persistence/auth.repository';
import { AUTH_DI_TOKEN } from './auth.di-token';
import { TokenService } from './infra/services/token.service';
import { RegisterCommandHandler } from './use-case/commands/handlers/register.command.handler';
import { LoginCommandHandler } from './use-case/commands/handlers/login.command.handler';
import { AuthController } from './presentation/controllers/auth.controller';

const commandHandlers = [RegisterCommandHandler, LoginCommandHandler];

@Module({
  imports: [
    CqrsModule,
    JwtModule.register({}),
    TypeOrmModule.forFeature([RefreshTokenEntity]),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [
    TokenService,
    {
      provide: AUTH_DI_TOKEN.REPOSITORY,
      useClass: AuthRepository,
    },
    ...commandHandlers,
  ],
  exports: [AUTH_DI_TOKEN.REPOSITORY, TokenService],
})
export class AuthModule {}
