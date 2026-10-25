import { Uuid } from 'shared/domain/value-objects/uuid.vo';

export class UserDeletedEvent {
  constructor(public readonly userId: Uuid) {}
}
