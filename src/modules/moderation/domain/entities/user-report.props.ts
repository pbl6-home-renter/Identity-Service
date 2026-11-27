import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { UserReportContextType } from '../enums/user-report-context-type.enum';
import { UserReportStatus } from '../enums/user-report-status.enum';
import { ViolationCategory } from '../enums/violation-category.enum';

export interface UserReportProps {
  id: Uuid;
  reporterId: Uuid;
  reportedUserId: Uuid;
  category: ViolationCategory;
  description: string;
  evidenceMediaIds: Uuid[];
  contextType: UserReportContextType | null;
  contextId: Uuid | null;
  status: UserReportStatus;
  resolutionNote: string | null;
  resolvedBy: Uuid | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserReportSubmitInput {
  reporterId: Uuid;
  reportedUserId: Uuid;
  category: ViolationCategory;
  description: string;
  evidenceMediaIds: Uuid[];
  contextType: UserReportContextType | null;
  contextId: Uuid | null;
}
