import { IQuery } from '@nestjs/cqrs';
import { ReportSearch } from '../../ports/moderation-query-service.port';

export class ReportListAdminQuery implements IQuery {
  constructor(readonly search: ReportSearch) {}
}
