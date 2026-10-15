import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { LandlordProfile } from '../entities/landlord-profile';

export interface ILandlordProfileRepository {
  findByUserId(userId: Uuid): Promise<LandlordProfile | null>;
  save(profile: LandlordProfile): Promise<void>;
  softDeleteByUserId(userId: Uuid): Promise<void>;
}
