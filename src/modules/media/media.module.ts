import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from 'modules/users/users.module';
import { MediaCompleteUploadCommandHandler } from './application/commands/media-complete-upload/media-complete-upload.command.handler';
import { MediaDeleteCommandHandler } from './application/commands/media-delete/media-delete.command.handler';
import { MediaPresignUploadCommandHandler } from './application/commands/media-presign-upload/media-presign-upload.command.handler';
import { MediaGetQueryHandler } from './application/queries/media-get/media-get.query.handler';
import { MediaGetDownloadUrlQueryHandler } from './application/queries/media-get-download-url/media-get-download-url.query.handler';
import { MediaAccessService } from './application/services/media-access.service';
import { MediaConfigService } from './infrastructure/config/media-config.service';
import { LocalUserOwnerResolver } from './infrastructure/owners/local-user-owner.resolver';
import { MediaOwnerResolverRegistry } from './infrastructure/owners/media-owner-resolver.registry';
import { TenancyOwnerResolver } from './infrastructure/owners/tenancy-owner.resolver';
import { UnavailableOwnerResolver } from './infrastructure/owners/unavailable-owner.resolver';
import { CommunityConversationOwnerResolver } from './infrastructure/owners/community-conversation-owner.resolver';
import { MediaRepository } from './infrastructure/persistence/media.repository';
import { MediaEntity } from './infrastructure/persistence/media.typeorm-entity';
import { R2ObjectStorage } from './infrastructure/storage/r2-object-storage';
import { MEDIA_DI_TOKEN } from './media.di-token';
import { MediaController } from './presentation/http/controllers/media.controller';
import { MediaInternalController } from './presentation/http/controllers/media-internal.controller';
import { MediaChatAttachmentValidateQueryHandler } from './application/queries/media-chat-attachment-validate/media-chat-attachment-validate.query.handler';
import { MediaConversationAvatarValidateQueryHandler } from './application/queries/media-conversation-avatar-validate/media-conversation-avatar-validate.query.handler';
import { MediaLookupInternalQueryHandler } from './application/queries/media-lookup-internal/media-lookup-internal.query.handler';
import { MediaOwnerLookupQueryHandler } from './application/queries/media-owner-lookup/media-owner-lookup.query.handler';
import { MediaUserAvatarLookupQueryHandler } from './application/queries/media-user-avatar-lookup/media-user-avatar-lookup.query.handler';
import { InboxModule } from 'modules/inbox/inbox.module';
import { MediaOwnerDeletedSubscriber } from './presentation/messaging/media-owner-deleted.subscriber';

const commandHandlers = [
  MediaPresignUploadCommandHandler,
  MediaCompleteUploadCommandHandler,
  MediaDeleteCommandHandler,
];

const queryHandlers = [
  MediaGetQueryHandler,
  MediaGetDownloadUrlQueryHandler,
  MediaChatAttachmentValidateQueryHandler,
  MediaConversationAvatarValidateQueryHandler,
  MediaLookupInternalQueryHandler,
  MediaOwnerLookupQueryHandler,
  MediaUserAvatarLookupQueryHandler,
];

const ownerResolvers = [
  LocalUserOwnerResolver,
  TenancyOwnerResolver,
  UnavailableOwnerResolver,
  CommunityConversationOwnerResolver,
];

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([MediaEntity]),
    UsersModule,
    InboxModule,
  ],
  controllers: [MediaController, MediaInternalController],
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
    MediaOwnerDeletedSubscriber,
  ],
})
export class MediaModule {}
