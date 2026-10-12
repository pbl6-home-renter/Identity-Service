import { IQuery } from '@nestjs/cqrs';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { CurrentUserProfileResult } from '../../results/current-user-profile.result';

export class GetMeQuery implements IQuery {
  private constructor(readonly userId: Uuid) {}

  static create(userId: Uuid): GetMeQuery {
    return new GetMeQuery(userId);
  }
}

export type GetMeQueryResult = CurrentUserProfileResult;
