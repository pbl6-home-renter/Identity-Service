import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { PaginatedResult } from 'shared/application/pagination/paginated-result';
import { AuditLogAction } from '../queries/models/audit-log-action';
import { AuditLogEntityType } from '../queries/models/audit-log-entity-type';
import { AuditLogListItem } from '../queries/models/audit-log-list-item.model';
import { AuditLogDetail } from '../queries/models/audit-log-detail.model';

export interface AuditLogSearch {
  pageNo: number;
  pageSize: number;
  action?: AuditLogAction;
  entityType?: AuditLogEntityType;
  actorId?: Uuid;
  entityId?: Uuid;
  from?: Date;
  to?: Date;
}

export interface IAuditLogQueryService {
  findAuditLogsAdmin(
    search: AuditLogSearch,
  ): Promise<PaginatedResult<AuditLogListItem>>;
  findById(id: Uuid): Promise<AuditLogDetail | null>;
}
