import { BaseRepository } from 'shared/domain/repositories/base.repository';
import { User } from '../entities/user';

export interface UserRepository extends BaseRepository<User> {
  findByEmail(email: string): Promise<User | null>;
  findByPhone(phone: string): Promise<User | null>;
  findByIdentifier(identifier: string): Promise<User | null>;
}
