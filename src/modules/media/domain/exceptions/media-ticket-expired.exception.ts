import { DomainException } from 'shared/domain/exceptions/domain.exception';

export class MediaTicketExpiredException extends DomainException {
  constructor() {
    super('Upload ticket has expired', 410, 'TICKET_EXPIRED');
  }
}
