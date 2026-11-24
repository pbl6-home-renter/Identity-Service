export interface AuditEntry {
  action: string;
  entityType: string;
  entityId: string | null;
  actorId: string | null;
  metadata?: Record<string, unknown>;
  sourceService?: 'identity' | 'tenancy';
  occurredAt?: Date;
  sourceEventId?: string;
}
