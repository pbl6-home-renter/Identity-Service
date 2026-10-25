import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LandlordProfilesModule } from 'modules/landlord-profiles/landlord-profiles.module';
import { OutboxModule } from 'modules/outbox/outbox.module';
import { UserEntity } from './infrastructure/persistence/user.typeorm-entity';
import { UserRepository } from './infrastructure/persistence/user.repository';
import { UserQueryService } from './infrastructure/services/user-query.service';
import { BcryptPasswordHasher } from './infrastructure/services/bcrypt-password-hasher';
import { USERS_DI_TOKEN } from './users.di-token';
import { UserController } from './presentation/http/controllers/user.controller';
import { UserAdminController } from './presentation/http/controllers/user-admin.controller';
import { UserGetMeQueryHandler } from './application/queries/user-get-me/user-get-me.query.handler';
import { UserUpdateMeCommandHandler } from './application/commands/user-update-me/user-update-me.command.handler';
import { UserChangePasswordCommandHandler } from './application/commands/user-change-password/user-change-password.command.handler';
import { UserListAdminQueryHandler } from './application/queries/user-list-admin/user-list-admin.query.handler';
import { UserGetDetailAdminQueryHandler } from './application/queries/user-get-detail-admin/user-get-detail-admin.query.handler';
import { UserUpdateAdminCommandHandler } from './application/commands/user-update-admin/user-update-admin.command.handler';
import { UserLockCommandHandler } from './application/commands/user-lock/user-lock.command.handler';
import { UserUnlockCommandHandler } from './application/commands/user-unlock/user-unlock.command.handler';
import { UserDeleteCommandHandler } from './application/commands/user-delete/user-delete.command.handler';

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
    OutboxModule,
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
    {
      provide: USERS_DI_TOKEN.PASSWORD_HASHER,
      useClass: BcryptPasswordHasher,
    },
    ...commandHandlers,
    ...queryHandlers,
  ],
  exports: [
    USERS_DI_TOKEN.REPOSITORY,
    USERS_DI_TOKEN.QUERY_SERVICE,
    USERS_DI_TOKEN.PASSWORD_HASHER,
    TypeOrmModule,
  ],
})
export class UsersModule {}
