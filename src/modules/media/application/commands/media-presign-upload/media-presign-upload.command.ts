import { ICommand } from '@nestjs/cqrs';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { MediaUploadRequest } from '../../../domain/entities/media.props';
import { MediaCaptureSource } from '../../../domain/enums/media-capture-source.enum';
import { MediaOwnerType } from '../../../domain/enums/media-owner-type.enum';
import { MediaPurpose } from '../../../domain/enums/media-purpose.enum';
import { MediaActor } from '../../../domain/value-objects/media-actor';

/** Fields the caller supplies; the request DTO implements this. */
export interface MediaPresignUploadInput {
  ownerType: MediaOwnerType;
  ownerId: Uuid;
  purpose: MediaPurpose;
  fileName: string;
  contentType: string;
  size: number;
  captureSource?: MediaCaptureSource | null;
}

export class MediaPresignUploadCommand implements ICommand {
  private constructor(
    readonly actor: MediaActor,
    readonly request: MediaUploadRequest,
  ) {}

  static create(
    actor: MediaActor,
    input: MediaPresignUploadInput,
  ): MediaPresignUploadCommand {
    return new MediaPresignUploadCommand(actor, {
      ownerType: input.ownerType,
      ownerId: input.ownerId,
      purpose: input.purpose,
      fileName: input.fileName,
      contentType: input.contentType,
      sizeBytes: input.size,
      captureSource: input.captureSource ?? null,
      uploaderId: actor.id,
    });
  }
}
