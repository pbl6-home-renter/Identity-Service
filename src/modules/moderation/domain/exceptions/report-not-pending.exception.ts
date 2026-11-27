import { DomainException } from 'shared/domain/exceptions/domain.exception';

export class ReportNotPendingException extends DomainException {
  constructor() {
    super('The report has already been resolved', 409, 'REPORT_NOT_PENDING');
  }
}
