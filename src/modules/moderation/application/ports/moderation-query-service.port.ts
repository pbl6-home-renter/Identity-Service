import { PaginatedResult } from 'shared/application/pagination/paginated-result';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { AccountAppealStatus } from '../../domain/enums/account-appeal-status.enum';
import { UserReportStatus } from '../../domain/enums/user-report-status.enum';
import { ViolationCategory } from '../../domain/enums/violation-category.enum';
import {
  AppealDetailModel,
  AppealListItemModel,
} from '../queries/models/appeal.model';
import {
  ReportDetailModel,
  ReportListItemModel,
} from '../queries/models/report.model';

export interface AppealSearch {
  pageNo: number;
  pageSize: number;
  status?: AccountAppealStatus;
  userId?: Uuid;
}

export interface ReportSearch {
  pageNo: number;
  pageSize: number;
  status?: UserReportStatus;
  category?: ViolationCategory;
  reportedUserId?: Uuid;
}

/** Admin read models that join appeal/report rows with user summaries. */
export interface IModerationQueryService {
  findAppeals(
    search: AppealSearch,
  ): Promise<PaginatedResult<AppealListItemModel>>;
  findAppealById(id: Uuid): Promise<AppealDetailModel | null>;
  findReports(
    search: ReportSearch,
  ): Promise<PaginatedResult<ReportListItemModel>>;
  findReportById(id: Uuid): Promise<ReportDetailModel | null>;
}
