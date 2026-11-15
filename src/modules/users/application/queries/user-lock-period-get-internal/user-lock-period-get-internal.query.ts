import { Uuid } from 'shared/domain/value-objects/uuid.vo';

export class UserLockPeriodGetInternalQuery {
  constructor(
    readonly userId: Uuid,
    readonly lockedAt: Date,
  ) {}
}
