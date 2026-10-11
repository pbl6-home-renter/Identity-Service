import { BaseEntity } from 'shared/domain/entities/base.entity';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { generateUuid } from 'utils/uuid.utils';
import { UserRole } from '../enums/user-role.enum';
import { UserStatus } from '../enums/user-status.enum';

export class User extends BaseEntity {
  private constructor(
    readonly phone: string,
    readonly email: string,
    readonly password: string,
    readonly name: string,
    readonly role: UserRole,
    readonly status: UserStatus,
    readonly lockReason: string | null,
    readonly lockedAt: Date | null,
    id: Uuid,
    createdAt: Date,
    updatedAt: Date,
    isDeleted: boolean = false,
  ) {
    super(id, createdAt, updatedAt, isDeleted);
  }

  static create(
    props: Omit<
      User,
      'id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'markAsDeleted'
    > & {
      id?: Uuid;
      createdAt?: Date;
      updatedAt?: Date;
      isDeleted?: boolean;
    },
  ): User {
    return new User(
      props.phone,
      props.email,
      props.password,
      props.name,
      props.role,
      props.status,
      props.lockReason,
      props.lockedAt,
      props.id ?? generateUuid(),
      props.createdAt ?? new Date(),
      props.updatedAt ?? new Date(),
      props.isDeleted ?? false,
    );
  }
}
