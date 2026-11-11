import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { MediaOwnerType } from '../../../domain/enums/media-owner-type.enum';
import { MediaPurpose } from '../../../domain/enums/media-purpose.enum';

export class MediaOwnerLookupQuery {
  constructor(
    readonly ownerType: MediaOwnerType,
    readonly ownerId: Uuid,
    readonly purpose?: MediaPurpose,
  ) {}
}
