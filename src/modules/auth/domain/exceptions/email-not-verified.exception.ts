import { DomainException } from 'shared/domain/exceptions/domain.exception';

export class EmailNotVerifiedException extends DomainException {
  constructor() {
    super(
      'Verify your email address before logging in',
      403,
      'EMAIL_NOT_VERIFIED',
    );
  }
}
