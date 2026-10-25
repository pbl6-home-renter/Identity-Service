import { IQuery } from '@nestjs/cqrs';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';

export class UserGetDetailAdminQuery implements IQuery {
  constructor(readonly userId: Uuid) {}

  static create(userId: Uuid): UserGetDetailAdminQuery {
    return new UserGetDetailAdminQuery(userId);
  }
}
