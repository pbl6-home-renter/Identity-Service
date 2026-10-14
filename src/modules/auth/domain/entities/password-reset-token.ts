import { BaseEntity } from 'shared/domain/entities/base.entity';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { generateUuid } from 'utils/uuid.utils';

export class PasswordResetToken extends BaseEntity {
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

  static create(
    props: Omit<
      PasswordResetToken,
      'id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'markAsDeleted'
    > & {
      id?: Uuid;
      createdAt?: Date;
      updatedAt?: Date;
      isDeleted?: boolean;
    },
  ): PasswordResetToken {
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
