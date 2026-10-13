import { UserRole } from 'modules/users/domain/enums/user-role.enum';

export interface JwtPayload {
  sub?: string;
  role?: UserRole;
}
