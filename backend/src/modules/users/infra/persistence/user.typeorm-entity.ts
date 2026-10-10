import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { LandlordProfileTypeormEntity } from './landlord-profile.typeorm-entity';
import { RefreshTokenTypeormEntity } from '../../../auth/infra/persistence/refresh-token.typeorm-entity';

export enum UserRole {
  LANDLORD = 'landlord',
  TENANT = 'tenant',
  ADMIN = 'admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  LOCKED = 'locked',
}

@Entity('users')
export class UserTypeormEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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
    enumName: 'users_role_enum',
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    enumName: 'users_status_enum',
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    name: 'lock_reason',
  })
  lockReason: string | null;

  @Column({
    type: 'timestamptz',
    nullable: true,
    name: 'locked_at',
  })
  lockedAt: Date | null;

  @CreateDateColumn({
    type: 'timestamptz',
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
    name: 'updated_at',
    default: () => 'now()',
  })
  updatedAt: Date;

  @Column({
    type: 'boolean',
    default: false,
    name: 'is_deleted',
  })
  isDeleted: boolean;

  @OneToOne(() => LandlordProfileTypeormEntity, (profile) => profile.user)
  landlordProfile?: LandlordProfileTypeormEntity;

  @OneToMany(() => RefreshTokenTypeormEntity, (token) => token.user)
  refreshTokens?: RefreshTokenTypeormEntity[];
}
