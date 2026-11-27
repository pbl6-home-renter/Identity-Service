import { IQuery } from '@nestjs/cqrs';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';

export class AppealGetCurrentQuery implements IQuery {
  constructor(readonly userId: Uuid) {}
}
