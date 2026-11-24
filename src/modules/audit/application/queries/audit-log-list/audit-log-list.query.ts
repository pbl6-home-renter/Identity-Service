import { IQuery } from '@nestjs/cqrs';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { ValidationException } from 'shared/domain/exceptions/validation.exception';
import { AuditLogAction } from '../models/audit-log-action';
import { AuditLogEntityType } from '../models/audit-log-entity-type';
import { AuditLogSearch } from '../../ports/audit-log-query-service.port';

export interface AuditLogListInput {
  pageNo: number;
  pageSize: number;
  action?: AuditLogAction;
  entityType?: AuditLogEntityType;
  actorId?: Uuid;
  entityId?: Uuid;
  from?: string;
  to?: string;
}

export class AuditLogListQuery implements IQuery {
  constructor(readonly search: AuditLogSearch) {}

  static create(input: AuditLogListInput): AuditLogListQuery {
    const from = input.from === undefined ? undefined : new Date(input.from);
    const to = input.to === undefined ? undefined : new Date(input.to);
    if (
      (from && !Number.isFinite(from.getTime())) ||
      (to && !Number.isFinite(to.getTime())) ||
      (from && to && from.getTime() > to.getTime())
    ) {
      throw new ValidationException('Invalid audit log date range');
    }
    return new AuditLogListQuery({
      pageNo: input.pageNo,
      pageSize: input.pageSize,
      action: input.action,
      entityType: input.entityType,
      actorId: input.actorId,
      entityId: input.entityId,
      from,
      to,
    });
  }
}
