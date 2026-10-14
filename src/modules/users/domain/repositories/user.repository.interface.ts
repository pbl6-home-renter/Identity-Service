import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { BaseRepository } from 'shared/domain/repositories/base.repository';
import { User } from '../entities/user';

export interface IUserRepository extends BaseRepository<User> {
  changePassword(
    userId: Uuid,
    currentPassword: string,
    newPassword: string,
  ): Promise<void>;
  findByEmail(email: string): Promise<User | null>;
  findByPhone(phone: string): Promise<User | null>;
  findByIdentifier(identifier: string): Promise<User | null>;
}
