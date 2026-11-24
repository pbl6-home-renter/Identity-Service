import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { AUDIT_LOG_QUERY_SERVICE_DI_TOKEN } from '../../../audit.di-token';
import { AuditLogNotFoundException } from '../../../domain/exceptions/audit-log-not-found.exception';
import { IAuditLogQueryService } from '../../ports/audit-log-query-service.port';
import { AuditLogDetail } from '../models/audit-log-detail.model';
import { AuditLogDetailQuery } from './audit-log-detail.query';

@QueryHandler(AuditLogDetailQuery)
export class AuditLogDetailQueryHandler implements IQueryHandler<
  AuditLogDetailQuery,
  AuditLogDetail
> {
  constructor(
    @Inject(AUDIT_LOG_QUERY_SERVICE_DI_TOKEN)
    private readonly queryService: IAuditLogQueryService,
  ) {}

  async execute(query: AuditLogDetailQuery): Promise<AuditLogDetail> {
    const result = await this.queryService.findById(query.auditLogId);
    if (!result) throw new AuditLogNotFoundException();
    return result;
  }
}
