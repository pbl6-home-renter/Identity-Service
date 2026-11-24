import { DomainException } from 'shared/domain/exceptions/domain.exception';

export class AuditLogNotFoundException extends DomainException {
  constructor() {
    super('Audit log not found', 404, 'AUDIT_LOG_NOT_FOUND');
  }
}
