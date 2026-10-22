import { AggregateRoot } from 'shared/domain/entities/aggregate-root';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { generateUuid } from 'utils/uuid.utils';
import { RefreshTokenProps } from './refresh-token.props';

export class RefreshToken extends AggregateRoot {
  private constructor(
    readonly userId: Uuid,
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

  static reconstitute(props: RefreshTokenProps): RefreshToken {
    return new RefreshToken(
      props.userId,
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
