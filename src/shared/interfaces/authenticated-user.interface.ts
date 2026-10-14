import { UserRole } from 'modules/users/domain/enums/user-role.enum';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';

export interface AuthenticatedUser {
  id: Uuid;
  role: UserRole;
}
