import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaginatedResult } from 'shared/application/pagination/paginated-result';
import { MODERATION_DI_TOKEN } from '../../../moderation.di-token';
import { IModerationQueryService } from '../../ports/moderation-query-service.port';
import { ReportListItemModel } from '../models/report.model';
import { ReportListAdminQuery } from './report-list-admin.query';

@QueryHandler(ReportListAdminQuery)
export class ReportListAdminQueryHandler implements IQueryHandler<
  ReportListAdminQuery,
  PaginatedResult<ReportListItemModel>
> {
  constructor(
    @Inject(MODERATION_DI_TOKEN.QUERY_SERVICE)
    private readonly queryService: IModerationQueryService,
  ) {}

  execute({
    search,
  }: ReportListAdminQuery): Promise<PaginatedResult<ReportListItemModel>> {
    return this.queryService.findReports(search);
  }
}
