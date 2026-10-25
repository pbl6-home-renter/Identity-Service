import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { BaseRepository } from 'shared/domain/repositories/base.repository';
import { TransactionContext } from 'shared/domain/repositories/transaction-context';
import { User } from '../entities/user';
import { Email } from '../value-objects/email.vo';
import { Phone } from '../value-objects/phone.vo';

export interface IUserRepository extends BaseRepository<User> {
  updatePassword(
    userId: Uuid,
    newHashedPassword: string,
    context?: TransactionContext,
  ): Promise<void>;
  /** Unlike `findById`, also returns soft-deleted users. */
  findByIdIncludingDeleted(id: Uuid): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  findByPhone(phone: Phone): Promise<User | null>;
}
