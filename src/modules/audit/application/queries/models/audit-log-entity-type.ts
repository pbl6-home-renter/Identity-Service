export const AUDIT_LOG_ENTITY_TYPES = ['user', 'building'] as const;
export type AuditLogEntityType = (typeof AUDIT_LOG_ENTITY_TYPES)[number];
