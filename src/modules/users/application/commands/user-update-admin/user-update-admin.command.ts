import { ICommand } from '@nestjs/cqrs';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';

/** Fields the caller supplies; the request DTO implements this. */
export interface UserUpdateAdminInput {
  name?: string;
  phone?: string;
}

export class UserUpdateAdminCommand implements ICommand {
  constructor(
    readonly adminId: Uuid,
    readonly userId: Uuid,
    readonly name?: string,
    readonly phone?: string,
  ) {}

  static create(
    adminId: Uuid,
    userId: Uuid,
    request: UserUpdateAdminInput,
  ): UserUpdateAdminCommand {
    return new UserUpdateAdminCommand(
      adminId,
      userId,
      request.name,
      request.phone,
    );
  }
}
