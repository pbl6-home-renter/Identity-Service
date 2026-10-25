import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from 'shared/infrastructure/database/abstract.typeorm-entity';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { UserEntity } from 'modules/users/infrastructure/persistence/user.typeorm-entity';

@Entity('refresh_tokens')
export class RefreshTokenEntity extends AbstractEntity {
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
