import { ICommand } from '@nestjs/cqrs';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';

export class AppealAcceptCommand implements ICommand {
  constructor(
    readonly adminId: Uuid,
    readonly appealId: Uuid,
  ) {}
}
