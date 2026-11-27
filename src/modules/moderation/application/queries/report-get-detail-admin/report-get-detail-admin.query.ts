import { IQuery } from '@nestjs/cqrs';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';

export class ReportGetDetailAdminQuery implements IQuery {
  constructor(readonly reportId: Uuid) {}
}
