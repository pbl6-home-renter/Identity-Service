import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { UserReportContextType } from '../../../domain/enums/user-report-context-type.enum';
import { UserReportStatus } from '../../../domain/enums/user-report-status.enum';
import { ViolationCategory } from '../../../domain/enums/violation-category.enum';
import { ModerationUserSummary } from './appeal.model';

export interface ReportListItemModel {
  id: Uuid;
  reporter: ModerationUserSummary;
  reportedUser: ModerationUserSummary;
  category: ViolationCategory;
  description: string;
  evidenceCount: number;
  status: UserReportStatus;
  createdAt: Date;
  resolvedAt: Date | null;
}

export interface ReportDetailModel extends ReportListItemModel {
  evidenceMediaIds: Uuid[];
  contextType: UserReportContextType | null;
  contextId: Uuid | null;
  resolutionNote: string | null;
  resolvedBy: ModerationUserSummary | null;
}
