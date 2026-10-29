import { DomainException } from 'shared/domain/exceptions/domain.exception';

export class MediaStorageNotConfiguredException extends DomainException {
  constructor() {
    super(
      'Media storage is not configured (R2_* environment variables)',
      503,
      'SERVICE_UNAVAILABLE',
    );
  }
}
