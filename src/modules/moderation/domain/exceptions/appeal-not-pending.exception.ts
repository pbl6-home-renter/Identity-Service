import { DomainException } from 'shared/domain/exceptions/domain.exception';

export class AppealNotPendingException extends DomainException {
  constructor() {
    super('The appeal has already been reviewed', 409, 'APPEAL_NOT_PENDING');
  }
}
