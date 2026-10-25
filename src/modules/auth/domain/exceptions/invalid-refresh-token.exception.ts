import { DomainException } from 'shared/domain/exceptions/domain.exception';

export class InvalidRefreshTokenException extends DomainException {
  constructor() {
    super(
      'Refresh token is unknown, expired or revoked',
      401,
      'INVALID_REFRESH_TOKEN',
    );
  }
}
