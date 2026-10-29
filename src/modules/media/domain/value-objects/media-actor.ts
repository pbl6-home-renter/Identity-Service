import { UserRole } from 'shared/domain/enums/user-role.enum';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';

/** The caller asking for a media operation, taken from the verified access token. */
export interface MediaActor {
  readonly id: Uuid;
  readonly role: UserRole;
}
