import { ICommand } from '@nestjs/cqrs';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { UserUpdateAdminRequestDto } from '../../../presentation/request/user-update-admin.request.dto';

export class UserUpdateAdminCommand implements ICommand {
  constructor(
    readonly userId: Uuid,
    readonly name?: string,
    readonly phone?: string,
  ) {}

  static create(
    userId: Uuid,
    request: UserUpdateAdminRequestDto,
  ): UserUpdateAdminCommand {
    return new UserUpdateAdminCommand(userId, request.name, request.phone);
  }
}
