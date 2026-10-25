export const USER_AGGREGATE_TYPE = 'User';

export const USER_EVENTS = {
  REGISTERED: 'user.registered',
  UPDATED: 'user.updated',
  LOCKED: 'user.locked',
  UNLOCKED: 'user.unlocked',
  DELETED: 'user.deleted',
  PASSWORD_RESET_REQUESTED: 'user.password_reset_requested',
} as const;
