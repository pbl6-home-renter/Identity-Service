import { DomainException } from 'shared/domain/exceptions/domain.exception';

export class ReportAlreadyPendingException extends DomainException {
  constructor() {
    super(
      'You already reported this account and it is waiting for review',
      409,
      'REPORT_ALREADY_PENDING',
    );
  }
}
