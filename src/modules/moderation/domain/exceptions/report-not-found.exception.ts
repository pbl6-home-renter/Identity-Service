import { DomainException } from 'shared/domain/exceptions/domain.exception';

export class ReportNotFoundException extends DomainException {
  constructor() {
    super('Report not found', 404, 'REPORT_NOT_FOUND');
  }
}
