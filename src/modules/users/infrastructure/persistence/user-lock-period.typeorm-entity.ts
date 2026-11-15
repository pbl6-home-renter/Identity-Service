import { Check, Column, Entity, ForeignKey, PrimaryColumn } from 'typeorm';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { UserEntity } from './user.typeorm-entity';

@Entity('user_lock_periods')
@Check(
  'CHK_user_lock_periods_dates',
  'unlocked_at IS NULL OR unlocked_at >= locked_at',
)
export class UserLockPeriodTypeormEntity {
  @PrimaryColumn({ type: 'uuid' })
  @ForeignKey(() => UserEntity, 'id', { name: 'FK_user_lock_periods_user' })
  userId: Uuid;

  @PrimaryColumn({ type: 'timestamptz' })
  lockedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  unlockedAt: Date | null;
}
