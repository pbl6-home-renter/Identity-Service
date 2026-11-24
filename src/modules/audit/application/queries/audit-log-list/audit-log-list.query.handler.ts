import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaginatedResult } from 'shared/application/pagination/paginated-result';
import { AUDIT_LOG_QUERY_SERVICE_DI_TOKEN } from '../../../audit.di-token';
import { IAuditLogQueryService } from '../../ports/audit-log-query-service.port';
import { AuditLogListItem } from '../models/audit-log-list-item.model';
import { AuditLogListQuery } from './audit-log-list.query';

@QueryHandler(AuditLogListQuery)
export class AuditLogListQueryHandler implements IQueryHandler<
  AuditLogListQuery,
  PaginatedResult<AuditLogListItem>
> {
  constructor(
    @Inject(AUDIT_LOG_QUERY_SERVICE_DI_TOKEN)
    private readonly queryService: IAuditLogQueryService,
  ) {}

  execute(
    query: AuditLogListQuery,
  ): Promise<PaginatedResult<AuditLogListItem>> {
    return this.queryService.findAuditLogsAdmin(query.search);
  }
}
