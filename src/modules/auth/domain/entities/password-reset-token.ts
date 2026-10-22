import { AggregateRoot } from 'shared/domain/entities/aggregate-root';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { generateUuid } from 'utils/uuid.utils';
import { PasswordResetTokenProps } from './password-reset-token.props';
import { PasswordResetTokenExpiredException } from '../exceptions/password-reset-token-expired.exception';

export class PasswordResetToken extends AggregateRoot {
  private constructor(
    readonly userId: Uuid,
    readonly tokenHash: string,
    readonly expiresAt: Date,
    id: Uuid,
    createdAt: Date,
    updatedAt: Date,
    isDeleted: boolean = false,
  ) {
    super(id, createdAt, updatedAt, isDeleted);
  }

  isExpired(now: Date): boolean {
    return this.expiresAt.getTime() <= now.getTime();
  }

  assertUsable(now: Date): void {
    if (this.isExpired(now)) {
      throw new PasswordResetTokenExpiredException();
    }
  }

  static create(props: PasswordResetTokenProps): PasswordResetToken {
    return PasswordResetToken.reconstitute(props);
  }

  static reconstitute(props: PasswordResetTokenProps): PasswordResetToken {
    return new PasswordResetToken(
      props.userId,
      props.tokenHash,
      props.expiresAt,
      props.id ?? generateUuid(),
      props.createdAt ?? new Date(),
      props.updatedAt ?? new Date(),
      props.isDeleted ?? false,
    );
  }
}
