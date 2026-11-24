import { Uuid } from 'shared/domain/value-objects/uuid.vo';

export interface AuditLogListItem {
  id: Uuid;
  actorId: Uuid | null;
  actorName: string | null;
  action: string;
  entityType: string;
  entityId: Uuid | null;
  sourceService: 'identity' | 'tenancy';
  createdAt: Date;
}
