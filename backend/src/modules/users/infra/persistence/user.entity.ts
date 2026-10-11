import { Column, Entity, OneToMany, OneToOne } from 'typeorm';
import { BaseEntity } from 'shared/infra/typeorm/persistence/type-orm.abstract.entity';
import { UserRole } from '../../domain/enums/user-role.enum';
import { UserStatus } from '../../domain/enums/user-status.enum';
import { LandlordProfileEntity } from './landlord-profile.entity';
import { RefreshTokenEntity } from '../../../auth/infra/persistence/refresh-token.entity';

@Entity('users')
export class UserEntity extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 12,
    unique: true,
  })
  phone: string;

  @Column({
    type: 'varchar',
    length: 254,
    unique: true,
  })
  email: string;

  @Column({
    type: 'varchar',
    length: 255,
  })
  password: string;

  @Column({
    type: 'varchar',
    length: 254,
  })
  name: string;

  @Column({
    type: 'enum',
    enum: UserRole,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    name: 'lock_reason',
  })
  lockReason?: string | null;

  @Column({
    type: 'timestamptz',
    nullable: true,
    name: 'locked_at',
  })
  lockedAt?: Date | null;

  @OneToOne(
    () => LandlordProfileEntity,
    (landlordProfile) => landlordProfile.user,
  )
  landlordProfile?: LandlordProfileEntity | null;

  @OneToMany(() => RefreshTokenEntity, (refreshToken) => refreshToken.user)
  refreshTokens?: RefreshTokenEntity[];
}
