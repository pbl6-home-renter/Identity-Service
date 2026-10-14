import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from 'shared/infra/typeorm/persistence/type-orm.abstract.entity';
import { UserEntity } from '../../../users/infra/persistence/user.entity';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';

@Entity('password_reset_tokens')
export class PasswordResetTokenEntity extends BaseEntity {
  @Column({
    type: 'uuid',
    name: 'user_id',
  })
  userId: Uuid;

  @Column({
    type: 'varchar',
    length: 64,
    unique: true,
    name: 'token_hash',
  })
  tokenHash: string;

  @Column({
    type: 'timestamptz',
    name: 'expires_at',
  })
  expiresAt: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}
