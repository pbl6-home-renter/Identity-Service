import { DomainException } from 'shared/domain/exceptions/domain.exception';

export class MediaUploadNotCompletedException extends DomainException {
  constructor() {
    super(
      'File has not been uploaded to storage yet',
      409,
      'UPLOAD_NOT_COMPLETED',
    );
  }
}
