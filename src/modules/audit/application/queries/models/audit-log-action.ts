export const AUDIT_LOG_ACTIONS = [
  'user.locked',
  'user.unlocked',
  'user.updated',
  'user.deleted',
  'appeal.rejected',
  'building.approved',
  'building.rejected',
] as const;
export type AuditLogAction = (typeof AUDIT_LOG_ACTIONS)[number];
