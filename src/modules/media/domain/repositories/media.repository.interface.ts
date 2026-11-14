import { TransactionContext } from 'shared/domain/repositories/transaction-context';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { Media } from '../entities/media';
import { MediaOwnerType } from '../enums/media-owner-type.enum';
import { MediaPurpose } from '../enums/media-purpose.enum';

export interface IMediaRepository {
  save(media: Media, context?: TransactionContext): Promise<void>;

  /** Includes soft-deleted media so callers can answer `410 MEDIA_DELETED`. */
  findById(id: Uuid): Promise<Media | null>;

  /** Finds media records in one read for internal domain response mapping. */
  findByIds(ids: readonly Uuid[]): Promise<Media[]>;

  /** Active media of an owner, used by idempotent owner-deletion cleanup. */
  findByOwner(ownerType: MediaOwnerType, ownerId: Uuid): Promise<Media[]>;

  /** Live, uploaded files of one owner for one purpose. */
  findUploadedByOwner(
    ownerType: MediaOwnerType,
    ownerId: Uuid,
    purpose: MediaPurpose,
  ): Promise<Media[]>;

  /** Live, uploaded files of many owners for one purpose, in one read. */
  findUploadedByOwners(
    ownerType: MediaOwnerType,
    ownerIds: readonly Uuid[],
    purpose: MediaPurpose,
  ): Promise<Media[]>;
}
