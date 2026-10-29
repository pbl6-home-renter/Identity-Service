import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from 'modules/users/users.module';
import { MediaCompleteUploadCommandHandler } from './application/commands/media-complete-upload/media-complete-upload.command.handler';
import { MediaDeleteCommandHandler } from './application/commands/media-delete/media-delete.command.handler';
import { MediaPresignUploadCommandHandler } from './application/commands/media-presign-upload/media-presign-upload.command.handler';
import { MediaGetQueryHandler } from './application/queries/media-get/media-get.query.handler';
import { MediaAccessService } from './application/services/media-access.service';
import { MediaConfigService } from './infrastructure/config/media-config.service';
import { LocalUserOwnerResolver } from './infrastructure/owners/local-user-owner.resolver';
import { MediaOwnerResolverRegistry } from './infrastructure/owners/media-owner-resolver.registry';
import { TenancyOwnerResolver } from './infrastructure/owners/tenancy-owner.resolver';
import { UnavailableOwnerResolver } from './infrastructure/owners/unavailable-owner.resolver';
import { MediaRepository } from './infrastructure/persistence/media.repository';
import { MediaEntity } from './infrastructure/persistence/media.typeorm-entity';
import { R2ObjectStorage } from './infrastructure/storage/r2-object-storage';
import { MEDIA_DI_TOKEN } from './media.di-token';
import { MediaController } from './presentation/http/controllers/media.controller';

const commandHandlers = [
  MediaPresignUploadCommandHandler,
  MediaCompleteUploadCommandHandler,
  MediaDeleteCommandHandler,
];

const queryHandlers = [MediaGetQueryHandler];

const ownerResolvers = [
  LocalUserOwnerResolver,
  TenancyOwnerResolver,
  UnavailableOwnerResolver,
];

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([MediaEntity]), UsersModule],
  controllers: [MediaController],
  providers: [
    MediaConfigService,
    MediaAccessService,
    ...ownerResolvers,
    {
      provide: MEDIA_DI_TOKEN.REPOSITORY,
      useClass: MediaRepository,
    },
    {
      provide: MEDIA_DI_TOKEN.OBJECT_STORAGE,
      useClass: R2ObjectStorage,
    },
    {
      provide: MEDIA_DI_TOKEN.OWNER_RESOLVER,
      useClass: MediaOwnerResolverRegistry,
    },
    {
      provide: MEDIA_DI_TOKEN.UPLOAD_LIMITS,
      inject: [MediaConfigService],
      useFactory: (config: MediaConfigService) => config.uploadLimits,
    },
    ...commandHandlers,
    ...queryHandlers,
  ],
})
export class MediaModule {}
