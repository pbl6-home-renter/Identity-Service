import { Column, Entity, ForeignKey, Index } from 'typeorm';
import { AbstractEntity } from 'shared/infrastructure/database/abstract.typeorm-entity';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { UserEntity } from 'modules/users/infrastructure/persistence/user.typeorm-entity';
import { UserReportContextType } from '../../domain/enums/user-report-context-type.enum';
import { UserReportStatus } from '../../domain/enums/user-report-status.enum';
import { ViolationCategory } from '../../domain/enums/violation-category.enum';

@Entity('user_reports')
@Index('IDX_user_reports_reported_status', ['reportedUserId', 'status'])
@Index('IDX_user_reports_status_created_at', ['status', 'createdAt'])
@Index('UQ_user_reports_pending_pair', ['reporterId', 'reportedUserId'], {
  unique: true,
  where: `"status" = 'pending'`,
})
export class UserReportEntity extends AbstractEntity {
  @Column({ type: 'uuid' })
  @ForeignKey(() => UserEntity, 'id', { name: 'FK_user_reports_reporter' })
  reporterId: Uuid;

  @Column({ type: 'uuid' })
  @ForeignKey(() => UserEntity, 'id', { name: 'FK_user_reports_reported' })
  reportedUserId: Uuid;

  @Column({ type: 'enum', enum: ViolationCategory })
  category: ViolationCategory;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'uuid', array: true, default: () => `'{}'` })
  evidenceMediaIds: Uuid[];

  @Column({ type: 'enum', enum: UserReportContextType, nullable: true })
  contextType: UserReportContextType | null;

  @Column({ type: 'uuid', nullable: true })
  contextId: Uuid | null;

  @Column({
    type: 'enum',
    enum: UserReportStatus,
    default: UserReportStatus.PENDING,
  })
  status: UserReportStatus;

  @Column({ type: 'varchar', length: 500, nullable: true })
  resolutionNote: string | null;

  @Column({ type: 'uuid', nullable: true })
  resolvedBy: Uuid | null;

  @Column({ type: 'timestamptz', nullable: true })
  resolvedAt: Date | null;
}
