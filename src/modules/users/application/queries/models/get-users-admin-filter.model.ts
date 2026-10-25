import { UserRole } from 'shared/domain/enums/user-role.enum';
import { UserStatus } from 'shared/domain/enums/user-status.enum';

export interface GetUsersAdminFilterModel extends Record<string, unknown> {
  readonly role?: UserRole;
  readonly status?: UserStatus;
  readonly searchKeyword?: string;
}
