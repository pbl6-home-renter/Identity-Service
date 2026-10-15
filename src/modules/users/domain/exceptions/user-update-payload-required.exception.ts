import { BaseException } from 'shared/domain/exceptions/base.exception';

export class UserUpdatePayloadRequiredException extends BaseException {
  constructor() {
    super(
      'At least one editable field is required',
      422,
      'USER_UPDATE_PAYLOAD_REQUIRED',
    );
  }
}
