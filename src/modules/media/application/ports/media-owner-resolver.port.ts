import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { MediaOwnerType } from '../../domain/enums/media-owner-type.enum';
import { OwnerSnapshot } from '../../domain/value-objects/owner-snapshot';

/** Asks the service that owns the parent entity who may access its files. */
export interface IMediaOwnerResolver {
  /** `null` when the owner does not exist. */
  resolve(
    ownerType: MediaOwnerType,
    ownerId: Uuid,
  ): Promise<OwnerSnapshot | null>;
}
