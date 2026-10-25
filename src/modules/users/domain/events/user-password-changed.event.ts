import { Uuid } from 'shared/domain/value-objects/uuid.vo';

export class UserPasswordChangedEvent {
  constructor(public readonly userId: Uuid) {}
}
