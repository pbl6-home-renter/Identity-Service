import { Column, Entity, ForeignKey, Index } from 'typeorm';
import { AbstractEntity } from 'shared/infrastructure/database/abstract.typeorm-entity';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { UserEntity } from 'modules/users/infrastructure/persistence/user.typeorm-entity';
import { AccountAppealStatus } from '../../domain/enums/account-appeal-status.enum';

@Entity('account_appeals')
@Index('IDX_account_appeals_user_locked_at', ['userId', 'lockedAt'])
@Index('IDX_account_appeals_status_created_at', ['status', 'createdAt'])
@Index('UQ_account_appeals_user_pending', ['userId'], {
  unique: true,
  where: `"status" = 'pending'`,
})
export class AccountAppealEntity extends AbstractEntity {
  @Column({ type: 'uuid' })
  @ForeignKey(() => UserEntity, 'id', { name: 'FK_account_appeals_user' })
  userId: Uuid;

  @Column({ type: 'timestamptz' })
  lockedAt: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  lockReason: string | null;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'uuid', array: true, default: () => `'{}'` })
  attachmentMediaIds: Uuid[];

  @Column({ type: 'varchar', length: 254, nullable: true })
  contactEmail: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  contactPhone: string | null;

  @Column({
    type: 'enum',
    enum: AccountAppealStatus,
    default: AccountAppealStatus.PENDING,
  })
  status: AccountAppealStatus;

  @Column({ type: 'varchar', length: 500, nullable: true })
  rejectReason: string | null;

  @Column({ type: 'uuid', nullable: true })
  reviewedBy: Uuid | null;

  @Column({ type: 'timestamptz', nullable: true })
  reviewedAt: Date | null;
}
