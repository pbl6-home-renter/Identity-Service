import { DomainException } from 'shared/domain/exceptions/domain.exception';

export class RefreshTokenReusedException extends DomainException {
  constructor() {
    super(
      'A rotated refresh token was reused; the session family was revoked',
      401,
      'TOKEN_REUSED',
    );
  }
}
