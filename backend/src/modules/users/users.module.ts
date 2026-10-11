import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './infra/persistence/user.entity';
import { UserRepository } from './infra/persistence/user.repository';
import { USERS_DI_TOKEN } from './users.di-token';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  providers: [
    {
      provide: USERS_DI_TOKEN.REPOSITORY,
      useClass: UserRepository,
    },
  ],
  exports: [USERS_DI_TOKEN.REPOSITORY, TypeOrmModule],
})
export class UsersModule {}
