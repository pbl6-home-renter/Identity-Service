import { DomainException } from 'shared/domain/exceptions/domain.exception';

export class AccountNotLockedException extends DomainException {
  constructor() {
    super(
      'Only a locked account can submit an appeal',
      409,
      'ACCOUNT_NOT_LOCKED',
    );
  }
}
