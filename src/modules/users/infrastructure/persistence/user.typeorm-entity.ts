import { Column, Entity, OneToMany, OneToOne } from 'typeorm';
import { AbstractEntity } from 'shared/infrastructure/database/abstract.typeorm-entity';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { UserStatus } from 'shared/domain/enums/user-status.enum';
import { LandlordProfileEntity } from 'modules/landlord-profiles/infrastructure/persistence/landlord-profile.typeorm-entity';
import { RefreshTokenEntity } from 'modules/auth/infrastructure/persistence/refresh-token.typeorm-entity';

@Entity('users')
export class UserEntity extends AbstractEntity {
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
