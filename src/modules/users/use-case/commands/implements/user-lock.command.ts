import { ICommand } from '@nestjs/cqrs';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { UserLockRequestDto } from '../../../presentation/request/user-lock.request.dto';

export class UserLockCommand implements ICommand {
  constructor(
    readonly adminId: Uuid,
    readonly userId: Uuid,
    readonly lockReason: string,
  ) {}

  static create(
    adminId: Uuid,
    userId: Uuid,
    request: UserLockRequestDto,
  ): UserLockCommand {
    return new UserLockCommand(adminId, userId, request.lockReason);
  }
}
