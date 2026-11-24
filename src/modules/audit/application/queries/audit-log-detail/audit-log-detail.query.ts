import { IQuery } from '@nestjs/cqrs';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';

export class AuditLogDetailQuery implements IQuery {
  constructor(readonly auditLogId: Uuid) {}

  static create(auditLogId: Uuid): AuditLogDetailQuery {
    return new AuditLogDetailQuery(auditLogId);
  }
}
