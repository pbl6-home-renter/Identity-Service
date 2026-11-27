import { IQuery } from '@nestjs/cqrs';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';

export class AppealGetDetailAdminQuery implements IQuery {
  constructor(readonly appealId: Uuid) {}
}
