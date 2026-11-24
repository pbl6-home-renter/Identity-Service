import { AuditLogListItem } from './audit-log-list-item.model';

export interface AuditLogDetail extends AuditLogListItem {
  metadata: Record<string, unknown>;
}
