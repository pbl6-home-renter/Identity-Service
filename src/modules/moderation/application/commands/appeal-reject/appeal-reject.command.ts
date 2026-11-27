import { ICommand } from '@nestjs/cqrs';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';

export class AppealRejectCommand implements ICommand {
  constructor(
    readonly adminId: Uuid,
    readonly appealId: Uuid,
    readonly rejectReason: string,
  ) {}
}
