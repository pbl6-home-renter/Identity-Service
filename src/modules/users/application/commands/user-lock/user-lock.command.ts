import { ICommand } from '@nestjs/cqrs';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';

/** Fields the caller supplies; the request DTO implements this. */
export interface UserLockInput {
  lockReason: string;
}

export class UserLockCommand implements ICommand {
  constructor(
    readonly adminId: Uuid,
    readonly userId: Uuid,
    readonly lockReason: string,
  ) {}

  static create(
    adminId: Uuid,
    userId: Uuid,
    request: UserLockInput,
  ): UserLockCommand {
    return new UserLockCommand(adminId, userId, request.lockReason);
  }
}
