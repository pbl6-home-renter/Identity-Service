import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LANDLORD_PROFILES_DI_TOKEN } from './landlord-profiles.di-token';
import { LandlordProfileEntity } from './infra/persistence/landlord-profile.entity';
import { LandlordProfileRepository } from './infra/persistence/landlord-profile.repository';

@Module({
  imports: [TypeOrmModule.forFeature([LandlordProfileEntity])],
  providers: [
    {
      provide: LANDLORD_PROFILES_DI_TOKEN.REPOSITORY,
      useClass: LandlordProfileRepository,
    },
  ],
  exports: [LANDLORD_PROFILES_DI_TOKEN.REPOSITORY],
})
export class LandlordProfilesModule {}
