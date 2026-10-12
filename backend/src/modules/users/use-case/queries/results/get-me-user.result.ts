import { LandlordProfile } from 'modules/landlord-profiles/domain/entities/landlord-profile';
import { User } from '../../../domain/entities/user';

export interface GetMeUserResult {
  user: User;
  landlordProfile: LandlordProfile | null;
}
