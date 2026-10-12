import { forwardRef, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { LandlordProfilesModule } from '../landlord-profiles/landlord-profiles.module';
import { UserEntity } from './infra/persistence/user.entity';
import { UserRepository } from './infra/persistence/user.repository';
import { USERS_DI_TOKEN } from './users.di-token';
import { UserController } from './presentation/controllers/user.controller';
import { GetMeQueryHandler } from './use-case/queries/handlers/get-me.query.handler';
import { UpdateMeCommandHandler } from './use-case/commands/handlers/update-me.command.handler';
import { ChangePasswordCommandHandler } from './use-case/commands/handlers/change-password.command.handler';

const commandHandlers = [UpdateMeCommandHandler, ChangePasswordCommandHandler];
const queryHandlers = [GetMeQueryHandler];

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([UserEntity]),
    LandlordProfilesModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [UserController],
  providers: [
    {
      provide: USERS_DI_TOKEN.REPOSITORY,
      useClass: UserRepository,
    },
    {
      provide: USERS_DI_TOKEN.GET_ME_QUERY_REPOSITORY,
      useExisting: USERS_DI_TOKEN.REPOSITORY,
    },
    ...commandHandlers,
    ...queryHandlers,
  ],
  exports: [USERS_DI_TOKEN.REPOSITORY, TypeOrmModule],
})
export class UsersModule {}
