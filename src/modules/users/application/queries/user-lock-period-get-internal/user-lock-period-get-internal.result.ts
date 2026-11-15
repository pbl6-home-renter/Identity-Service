export interface UserLockPeriodGetInternalResult {
  lockedAt: string;
  unlockedAt: string | null;
  latestLockedAt: string | null;
  observedAt: string;
  state: 'locked' | 'unlocked' | 'unknown';
}
