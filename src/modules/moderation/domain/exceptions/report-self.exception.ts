import { DomainException } from 'shared/domain/exceptions/domain.exception';

export class ReportSelfException extends DomainException {
  constructor() {
    super('You cannot report your own account', 422, 'REPORT_SELF');
  }
}
