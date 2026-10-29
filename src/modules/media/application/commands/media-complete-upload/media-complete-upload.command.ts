import { ICommand } from '@nestjs/cqrs';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { MediaActor } from '../../../domain/value-objects/media-actor';

export class MediaCompleteUploadCommand implements ICommand {
  private constructor(
    readonly actor: MediaActor,
    readonly mediaId: Uuid,
  ) {}

  static create(actor: MediaActor, mediaId: Uuid): MediaCompleteUploadCommand {
    return new MediaCompleteUploadCommand(actor, mediaId);
  }
}
