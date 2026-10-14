import { BaseEntity } from 'shared/domain/entities/base.entity';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { generateUuid } from 'utils/uuid.utils';

export class LandlordProfile extends BaseEntity {
  private constructor(
    readonly userId: Uuid,
    readonly bankCode: string | null,
    readonly accountNumber: string | null,
    readonly accountName: string | null,
    id: Uuid,
    createdAt: Date,
    updatedAt: Date,
    isDeleted: boolean = false,
  ) {
    super(id, createdAt, updatedAt, isDeleted);
  }

  static create(
    props: Omit<
      LandlordProfile,
      'id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'markAsDeleted'
    > & {
      id?: Uuid;
      createdAt?: Date;
      updatedAt?: Date;
      isDeleted?: boolean;
    },
  ): LandlordProfile {
    return new LandlordProfile(
      props.userId,
      props.bankCode ?? null,
      props.accountNumber ?? null,
      props.accountName ?? null,
      props.id ?? generateUuid(),
      props.createdAt ?? new Date(),
      props.updatedAt ?? new Date(),
      props.isDeleted ?? false,
    );
  }
}
