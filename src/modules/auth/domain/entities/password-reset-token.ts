import { AggregateRoot } from 'shared/domain/base/aggregate-root';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { generateUuid } from 'shared/domain/value-objects/uuid.vo';
import { PasswordResetTokenProps } from './password-reset-token.props';
import { PasswordResetTokenExpiredException } from '../exceptions/password-reset-token-expired.exception';
import { PasswordResetTokenUsedException } from '../exceptions/password-reset-token-used.exception';

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

  /** A used token is soft-deleted, so it can still be told apart from an unknown one. */
  assertUsable(now: Date): void {
    if (this.isDeleted) {
      throw new PasswordResetTokenUsedException();
    }

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
