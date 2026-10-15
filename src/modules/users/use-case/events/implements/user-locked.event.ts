import { IEvent } from '@nestjs/cqrs';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';

export class UserLockedEvent implements IEvent {
  constructor(public readonly userId: Uuid) {}
}
