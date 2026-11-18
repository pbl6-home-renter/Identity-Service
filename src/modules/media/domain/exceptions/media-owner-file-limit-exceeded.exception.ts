import { DomainException } from 'shared/domain/exceptions/domain.exception';

export class MediaOwnerFileLimitExceededException extends DomainException {
  constructor(limit: number) {
    super(
      `This resource cannot have more than ${limit} files`,
      422,
      'MEDIA_FILE_LIMIT_EXCEEDED',
    );
  }
}
