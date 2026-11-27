import { DomainException } from 'shared/domain/exceptions/domain.exception';

export class AppealNotFoundException extends DomainException {
  constructor() {
    super('Appeal not found', 404, 'APPEAL_NOT_FOUND');
  }
}
