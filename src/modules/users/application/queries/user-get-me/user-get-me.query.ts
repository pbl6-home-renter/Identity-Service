import { IQuery } from '@nestjs/cqrs';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';

export class UserGetMeQuery implements IQuery {
  private constructor(readonly userId: Uuid) {}

  static create(userId: Uuid): UserGetMeQuery {
    return new UserGetMeQuery(userId);
  }
}
