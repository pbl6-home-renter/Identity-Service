import { ICommand } from '@nestjs/cqrs';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';

export class UserUnlockCommand implements ICommand {
  constructor(readonly userId: Uuid) {}

  static create(userId: Uuid): UserUnlockCommand {
    return new UserUnlockCommand(userId);
  }
}
