import { IQuery } from '@nestjs/cqrs';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';

export class UserLookupInternalQuery implements IQuery {
  private constructor(readonly userIds: Uuid[]) {}

  static create(userIds: Uuid[]): UserLookupInternalQuery {
    return new UserLookupInternalQuery([...new Set(userIds)]);
  }
}
