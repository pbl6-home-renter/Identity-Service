import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { MediaOwnerType } from '../enums/media-owner-type.enum';

/**
 * What the service owning the parent entity says about it, enough to decide
 * who may touch its files. Media never stores this; it is looked up per request.
 */
export interface OwnerSnapshot {
  readonly ownerType: MediaOwnerType;
  readonly ownerId: Uuid;
  /** Landlord who manages the entity (building, room, contract, ...), if any. */
  readonly landlordId: Uuid | null;
  /** Other users involved: contract members, the issue reporter, chat members. */
  readonly participantUserIds: readonly Uuid[];
  /** Lifecycle status in the owning service, e.g. building `approved`. */
  readonly status: string | null;
}
