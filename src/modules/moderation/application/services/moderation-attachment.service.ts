import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { MediaLookupInternalQuery } from 'modules/media/application/queries/media-lookup-internal/media-lookup-internal.query';
import { MediaLookupInternalResult } from 'modules/media/application/queries/media-lookup-internal/media-lookup-internal.query.handler';
import { MediaOwnerType } from 'modules/media/domain/enums/media-owner-type.enum';
import { MediaPurpose } from 'modules/media/domain/enums/media-purpose.enum';
import { MediaStatus } from 'modules/media/domain/enums/media-status.enum';
import { ModerationAttachmentInvalidException } from '../../domain/exceptions/moderation-attachment-invalid.exception';

/** Appeal/report files must be the sender's own, finished uploads of the expected purpose. */
@Injectable()
export class ModerationAttachmentService {
  constructor(private readonly queryBus: QueryBus) {}

  async assertOwnUploads(
    userId: Uuid,
    mediaIds: readonly Uuid[],
    purpose: MediaPurpose,
  ): Promise<void> {
    const ids = [...new Set(mediaIds)];
    if (ids.length === 0) return;

    let media: MediaLookupInternalResult[];
    try {
      media = await this.queryBus.execute(new MediaLookupInternalQuery(ids));
    } catch {
      throw new ModerationAttachmentInvalidException();
    }
    const valid = media.every(
      (item) =>
        item.ownerType === MediaOwnerType.USER &&
        item.ownerId === userId &&
        item.purpose === purpose &&
        item.status === MediaStatus.UPLOADED,
    );
    if (!valid || media.length !== ids.length) {
      throw new ModerationAttachmentInvalidException();
    }
  }
}
