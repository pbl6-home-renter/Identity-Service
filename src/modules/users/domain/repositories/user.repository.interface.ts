import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { BaseRepository } from 'shared/domain/repositories/base.repository';
import { User } from '../entities/user';
import { Email } from '../value-objects/email.vo';
import { Phone } from '../value-objects/phone.vo';

export interface IUserRepository extends BaseRepository<User> {
  updatePassword(userId: Uuid, newHashedPassword: string): Promise<void>;
  findByEmail(email: Email): Promise<User | null>;
  findByPhone(phone: Phone): Promise<User | null>;
}
