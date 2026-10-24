import { BaseException } from 'shared/domain/exceptions/base.exception';

export class InvalidRefreshTokenException extends BaseException {
  constructor() {
    super(
      'Refresh token is unknown, expired or revoked',
      401,
      'INVALID_REFRESH_TOKEN',
    );
  }
}
