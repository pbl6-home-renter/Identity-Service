import { IEvent } from '@nestjs/cqrs';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';

/**
 * In-process signal published after an admin unlocks an account directly, so
 * other modules (moderation) can close what depended on the lock.
 */
export class UserUnlockedByAdminEvent implements IEvent {
  constructor(
    readonly userId: Uuid,
    readonly adminId: Uuid,
  ) {}
}
