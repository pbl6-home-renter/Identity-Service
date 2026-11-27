import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { UserStatus } from 'shared/domain/enums/user-status.enum';
import { AccountAppealStatus } from '../../../domain/enums/account-appeal-status.enum';

export interface ModerationUserSummary {
  id: Uuid;
  name: string | null;
  email: string | null;
  role: UserRole | null;
  status: UserStatus | null;
}

export interface AppealListItemModel {
  id: Uuid;
  user: ModerationUserSummary;
  lockReason: string | null;
  lockedAt: Date;
  content: string;
  attachmentCount: number;
  status: AccountAppealStatus;
  createdAt: Date;
  reviewedAt: Date | null;
}

export interface AppealDetailModel extends AppealListItemModel {
  attachmentMediaIds: Uuid[];
  contactEmail: string | null;
  contactPhone: string | null;
  rejectReason: string | null;
  reviewedBy: ModerationUserSummary | null;
}
