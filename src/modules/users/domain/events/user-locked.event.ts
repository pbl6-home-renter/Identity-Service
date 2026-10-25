import { Uuid } from 'shared/domain/value-objects/uuid.vo';

export class UserLockedEvent {
  constructor(public readonly userId: Uuid) {}
}
