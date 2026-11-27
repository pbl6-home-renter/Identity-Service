import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { AccountAppealStatus } from '../enums/account-appeal-status.enum';

export interface AccountAppealProps {
  id: Uuid;
  userId: Uuid;
  /** Identifies the lock period the appeal belongs to. */
  lockedAt: Date;
  lockReason: string | null;
  content: string;
  attachmentMediaIds: Uuid[];
  contactEmail: string | null;
  contactPhone: string | null;
  status: AccountAppealStatus;
  rejectReason: string | null;
  reviewedBy: Uuid | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccountAppealSubmitInput {
  userId: Uuid;
  lockedAt: Date;
  lockReason: string | null;
  content: string;
  attachmentMediaIds: Uuid[];
  contactEmail: string | null;
  contactPhone: string | null;
}
