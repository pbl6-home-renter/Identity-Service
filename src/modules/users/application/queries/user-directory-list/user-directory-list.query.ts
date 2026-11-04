import { IQuery } from '@nestjs/cqrs';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';

/** Fields the caller supplies; the request DTO implements this. */
export interface UserDirectoryListInput {
  pageNo: number;
  pageSize: number;
  q: string;
}

export class UserDirectoryListQuery implements IQuery {
  private constructor(
    readonly callerUserId: Uuid,
    readonly searchKeyword: string,
    readonly pageNo: number,
    readonly pageSize: number,
  ) {}

  static create(
    callerUserId: Uuid,
    request: UserDirectoryListInput,
  ): UserDirectoryListQuery {
    return new UserDirectoryListQuery(
      callerUserId,
      request.q,
      request.pageNo,
      request.pageSize,
    );
  }
}
