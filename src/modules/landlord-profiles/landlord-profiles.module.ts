import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LANDLORD_PROFILES_DI_TOKEN } from './landlord-profiles.di-token';
import { LandlordProfileEntity } from './infra/persistence/landlord-profile.entity';
import { LandlordProfileRepository } from './infra/persistence/landlord-profile.repository';
import { LandlordProfileSoftDeleteEventHandler } from './use-case/events/handlers/landlord-profile-soft-delete.event.handler';

const eventHandlers = [LandlordProfileSoftDeleteEventHandler];

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([LandlordProfileEntity])],
  providers: [
    {
      provide: LANDLORD_PROFILES_DI_TOKEN.REPOSITORY,
      useClass: LandlordProfileRepository,
    },
    ...eventHandlers,
  ],
  exports: [LANDLORD_PROFILES_DI_TOKEN.REPOSITORY],
})
export class LandlordProfilesModule {}
