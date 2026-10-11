import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity as UserTypeormEntity } from './infra/persistence/user.entity';
import { TypeOrmUserRepository } from './infra/persistence/user.repository';
import { USERS_DI_TOKEN } from './users.di-token';

@Module({
  imports: [TypeOrmModule.forFeature([UserTypeormEntity])],
  providers: [
    {
      provide: USERS_DI_TOKEN.REPOSITORY,
      useClass: TypeOrmUserRepository,
    },
  ],
  exports: [USERS_DI_TOKEN.REPOSITORY, TypeOrmModule],
})
export class UsersModule {}
