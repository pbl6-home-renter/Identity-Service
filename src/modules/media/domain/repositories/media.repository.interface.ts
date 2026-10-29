import { TransactionContext } from 'shared/domain/repositories/transaction-context';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { Media } from '../entities/media';
import { MediaOwnerType } from '../enums/media-owner-type.enum';
import { MediaPurpose } from '../enums/media-purpose.enum';

export interface IMediaRepository {
  save(media: Media, context?: TransactionContext): Promise<void>;

  /** Includes soft-deleted media so callers can answer `410 MEDIA_DELETED`. */
  findById(id: Uuid): Promise<Media | null>;

  /** Live, uploaded files of one owner for one purpose. */
  findUploadedByOwner(
    ownerType: MediaOwnerType,
    ownerId: Uuid,
    purpose: MediaPurpose,
  ): Promise<Media[]>;
}
