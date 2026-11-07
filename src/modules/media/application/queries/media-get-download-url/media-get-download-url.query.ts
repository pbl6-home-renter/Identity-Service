import { IQuery } from '@nestjs/cqrs';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { MediaActor } from '../../../domain/value-objects/media-actor';

export class MediaGetDownloadUrlQuery implements IQuery {
  constructor(
    readonly actor: MediaActor,
    readonly mediaId: Uuid,
  ) {}
}
