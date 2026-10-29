import { DomainException } from 'shared/domain/exceptions/domain.exception';

export class MediaCannotDeleteException extends DomainException {
  constructor() {
    super(
      'Media is kept as evidence and cannot be deleted',
      409,
      'CANNOT_DELETE',
    );
  }
}
