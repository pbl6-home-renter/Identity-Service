import { ICommand } from '@nestjs/cqrs';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';

export class UserDeleteCommand implements ICommand {
  constructor(
    readonly adminId: Uuid,
    readonly userId: Uuid,
  ) {}

  static create(adminId: Uuid, userId: Uuid): UserDeleteCommand {
    return new UserDeleteCommand(adminId, userId);
  }
}
