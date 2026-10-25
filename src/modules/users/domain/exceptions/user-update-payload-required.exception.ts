import { DomainException } from 'shared/domain/exceptions/domain.exception';

export class UserUpdatePayloadRequiredException extends DomainException {
  constructor() {
    super(
      'At least one editable field is required',
      422,
      'USER_UPDATE_PAYLOAD_REQUIRED',
    );
  }
}
