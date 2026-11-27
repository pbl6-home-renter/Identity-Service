import { DomainException } from 'shared/domain/exceptions/domain.exception';

export class AppealCooldownException extends DomainException {
  constructor(readonly nextSubmitAt: Date) {
    super(
      `A new appeal can be sent from ${nextSubmitAt.toISOString()}`,
      409,
      'APPEAL_COOLDOWN',
    );
  }
}
