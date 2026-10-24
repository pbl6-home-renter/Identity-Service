import { BaseException } from 'shared/domain/exceptions/base.exception';

export class RefreshTokenReusedException extends BaseException {
  constructor() {
    super(
      'A rotated refresh token was reused; the session family was revoked',
      401,
      'TOKEN_REUSED',
    );
  }
}
