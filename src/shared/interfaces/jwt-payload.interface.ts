import { UserRole } from 'shared/domain/enums/user-role.enum';

export interface JwtPayload {
  sub?: string;
  role?: UserRole;
}
