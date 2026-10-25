import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { TransactionContext } from 'shared/domain/repositories/transaction-context';
import { LandlordProfile } from '../entities/landlord-profile';

export interface ILandlordProfileRepository {
  findByUserId(userId: Uuid): Promise<LandlordProfile | null>;
  save(profile: LandlordProfile, context?: TransactionContext): Promise<void>;
  softDeleteByUserId(userId: Uuid, context?: TransactionContext): Promise<void>;
}
