import { User } from '../../domain/entities/user';

export interface UserUpdateAdminResult {
  readonly user: User;
  readonly changedFields: readonly ('name' | 'phone')[];
}
