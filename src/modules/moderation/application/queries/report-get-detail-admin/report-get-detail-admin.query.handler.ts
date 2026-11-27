import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ReportNotFoundException } from '../../../domain/exceptions/report-not-found.exception';
import { MODERATION_DI_TOKEN } from '../../../moderation.di-token';
import { IModerationQueryService } from '../../ports/moderation-query-service.port';
import { ReportDetailModel } from '../models/report.model';
import { ReportGetDetailAdminQuery } from './report-get-detail-admin.query';

@QueryHandler(ReportGetDetailAdminQuery)
export class ReportGetDetailAdminQueryHandler implements IQueryHandler<
  ReportGetDetailAdminQuery,
  ReportDetailModel
> {
  constructor(
    @Inject(MODERATION_DI_TOKEN.QUERY_SERVICE)
    private readonly queryService: IModerationQueryService,
  ) {}

  async execute({
    reportId,
  }: ReportGetDetailAdminQuery): Promise<ReportDetailModel> {
    const found = await this.queryService.findReportById(reportId);
    if (!found) throw new ReportNotFoundException();
    return found;
  }
}
