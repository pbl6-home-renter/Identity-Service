import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { PayoutAccount } from '../value-objects/payout-account.vo';

export interface LandlordProfileProps {
  id?: Uuid;
  userId: Uuid;
  payoutAccount?: PayoutAccount | null;
  createdAt?: Date;
  updatedAt?: Date;
  isDeleted?: boolean;
}
