import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LandlordProfilesModule } from '../landlord-profiles/landlord-profiles.module';
import { UserEntity } from './infra/persistence/user.entity';
import { UserRepository } from './infra/persistence/user.repository';
import { UserQueryService } from './infra/services/user-query.service';
import { USERS_DI_TOKEN } from './users.di-token';
import { UserController } from './presentation/controllers/user.controller';
import { UserAdminController } from './presentation/controllers/user-admin.controller';
import { UserGetMeQueryHandler } from './use-case/queries/handlers/user-get-me.query.handler';
import { UserUpdateMeCommandHandler } from './use-case/commands/handlers/user-update-me.command.handler';
import { UserChangePasswordCommandHandler } from './use-case/commands/handlers/user-change-password.command.handler';
import { UserListAdminQueryHandler } from './use-case/queries/handlers/user-list-admin.query.handler';
import { UserGetDetailAdminQueryHandler } from './use-case/queries/handlers/user-get-detail-admin.query.handler';
import { UserUpdateAdminCommandHandler } from './use-case/commands/handlers/user-update-admin.command.handler';
import { UserLockCommandHandler } from './use-case/commands/handlers/user-lock.command.handler';
import { UserUnlockCommandHandler } from './use-case/commands/handlers/user-unlock.command.handler';
import { UserDeleteCommandHandler } from './use-case/commands/handlers/user-delete.command.handler';

const commandHandlers = [
  UserUpdateMeCommandHandler,
  UserChangePasswordCommandHandler,
  UserUpdateAdminCommandHandler,
  UserLockCommandHandler,
  UserUnlockCommandHandler,
  UserDeleteCommandHandler,
];

const queryHandlers = [
  UserGetMeQueryHandler,
  UserListAdminQueryHandler,
  UserGetDetailAdminQueryHandler,
];

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([UserEntity]),
    LandlordProfilesModule,
  ],
  controllers: [UserController, UserAdminController],
  providers: [
    {
      provide: USERS_DI_TOKEN.REPOSITORY,
      useClass: UserRepository,
    },
    {
      provide: USERS_DI_TOKEN.QUERY_SERVICE,
      useClass: UserQueryService,
    },
    ...commandHandlers,
    ...queryHandlers,
  ],
  exports: [
    USERS_DI_TOKEN.REPOSITORY,
    USERS_DI_TOKEN.QUERY_SERVICE,
    TypeOrmModule,
  ],
})
export class UsersModule {}
