import { BaseException } from 'shared/domain/exceptions/base.exception';

export class UpdatePayloadRequiredException extends BaseException {
  constructor() {
    super(
      'At least one editable field is required',
      422,
      'UPDATE_PAYLOAD_REQUIRED',
    );
  }
}
