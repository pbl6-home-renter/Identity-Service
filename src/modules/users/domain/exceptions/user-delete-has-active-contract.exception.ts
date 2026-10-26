import { DomainException } from 'shared/domain/exceptions/domain.exception';

export class UserDeleteHasActiveContractException extends DomainException {
  constructor() {
    super(
      'User still has an active contract',
      409,
      'USER_DELETE_HAS_ACTIVE_CONTRACT',
    );
  }
}
