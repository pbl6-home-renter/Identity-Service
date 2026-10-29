import { IQuery } from '@nestjs/cqrs';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { MediaActor } from '../../../domain/value-objects/media-actor';

export class MediaGetQuery implements IQuery {
  private constructor(
    /** `null` for anonymous callers, who can only read public files. */
    readonly actor: MediaActor | null,
    readonly mediaId: Uuid,
  ) {}

  static create(actor: MediaActor | null, mediaId: Uuid): MediaGetQuery {
    return new MediaGetQuery(actor, mediaId);
  }
}
