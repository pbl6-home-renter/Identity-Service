import { DomainException } from 'shared/domain/exceptions/domain.exception';

export class MediaDeletedException extends DomainException {
  constructor() {
    super('Media has been deleted', 410, 'MEDIA_DELETED');
  }
}
