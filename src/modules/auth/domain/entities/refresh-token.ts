import { AggregateRoot } from 'shared/domain/base/aggregate-root';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { generateUuid } from 'shared/domain/value-objects/uuid.vo';
import { RefreshTokenProps } from './refresh-token.props';

export class RefreshToken extends AggregateRoot {
  private constructor(
    readonly userId: Uuid,
    readonly familyId: Uuid,
    readonly tokenHash: string,
    readonly expiresAt: Date,
    readonly revokedAt: Date | null,
    id: Uuid,
    createdAt: Date,
    updatedAt: Date,
    isDeleted: boolean = false,
  ) {
    super(id, createdAt, updatedAt, isDeleted);
  }

  static create(props: RefreshTokenProps): RefreshToken {
    return RefreshToken.reconstitute(props);
  }

  isUsable(now: Date): boolean {
    return this.revokedAt === null && this.expiresAt > now;
  }

  /** Successor in the same family, keeping the original session lifetime (remember-me or not). */
  rotate(tokenHash: string, now: Date): RefreshToken {
    const lifetimeMs = this.expiresAt.getTime() - this.createdAt.getTime();

    return RefreshToken.create({
      userId: this.userId,
      familyId: this.familyId,
      tokenHash,
      expiresAt: new Date(now.getTime() + lifetimeMs),
      revokedAt: null,
    });
  }

  static reconstitute(props: RefreshTokenProps): RefreshToken {
    return new RefreshToken(
      props.userId,
      props.familyId ?? generateUuid(),
      props.tokenHash,
      props.expiresAt,
      props.revokedAt ?? null,
      props.id ?? generateUuid(),
      props.createdAt ?? new Date(),
      props.updatedAt ?? new Date(),
      props.isDeleted ?? false,
    );
  }
}
