export const USER_AGGREGATE_TYPE = 'User';

export const USER_NOTIFICATION_EVENTS = {
  REQUESTED: 'notification.requested',
} as const;

export const USER_EVENTS = {
  REGISTERED: 'user.registered',
  EMAIL_VERIFIED: 'user.email_verified',
  UPDATED: 'user.updated',
  LOCKED: 'user.locked',
  UNLOCKED: 'user.unlocked',
  DELETED: 'user.deleted',
} as const;
