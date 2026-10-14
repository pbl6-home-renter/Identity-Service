import { LandlordProfile } from 'modules/landlord-profiles/domain/entities/landlord-profile';
import { User } from '../../../domain/entities/user';

export interface GetMeUserModel {
  readonly user: User;
  readonly landlordProfile: LandlordProfile | null;
}
