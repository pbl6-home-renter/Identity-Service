import { DomainException } from 'shared/domain/exceptions/domain.exception';

export class AppealAlreadyPendingException extends DomainException {
  constructor() {
    super(
      'An appeal is already waiting for review',
      409,
      'APPEAL_ALREADY_PENDING',
    );
  }
}
