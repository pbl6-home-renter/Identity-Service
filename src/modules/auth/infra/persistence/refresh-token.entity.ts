import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from 'shared/infra/typeorm/persistence/type-orm.abstract.entity';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { UserEntity } from '../../../users/infra/persistence/user.entity';

@Entity('refresh_tokens')
export class RefreshTokenEntity extends BaseEntity {
  @Column({
    type: 'uuid',
    name: 'user_id',
  })
  userId: Uuid;

  @Column({
    type: 'uuid',
    name: 'family_id',
  })
  familyId: Uuid;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'token_hash',
    unique: true,
  })
  tokenHash: string;

  @Column({
    type: 'timestamptz',
    name: 'expires_at',
  })
  expiresAt: Date;

  @Column({
    type: 'timestamptz',
    nullable: true,
    name: 'revoked_at',
  })
  revokedAt?: Date | null;

  @ManyToOne(() => UserEntity, (user) => user.refreshTokens, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}
