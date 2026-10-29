import { ICommand } from '@nestjs/cqrs';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { MediaActor } from '../../../domain/value-objects/media-actor';

export class MediaDeleteCommand implements ICommand {
  private constructor(
    readonly actor: MediaActor,
    readonly mediaId: Uuid,
  ) {}

  static create(actor: MediaActor, mediaId: Uuid): MediaDeleteCommand {
    return new MediaDeleteCommand(actor, mediaId);
  }
}
