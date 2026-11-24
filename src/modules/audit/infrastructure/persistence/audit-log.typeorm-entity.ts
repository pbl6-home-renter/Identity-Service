import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';

@Entity('audit_logs')
@Index('IDX_audit_logs_entity_occurred', [
  'entityType',
  'entityId',
  'occurredAt',
])
@Index('IDX_audit_logs_actor_occurred', ['actorId', 'occurredAt'])
@Index('UQ_audit_logs_source_event_id', ['sourceEventId'], { unique: true })
@Index('IDX_audit_logs_created', ['createdAt'])
@Index('IDX_audit_logs_action_created', ['action', 'createdAt'])
export class AuditLogTypeormEntity {
  // Audit records are append-only; they have no update or soft-delete fields.
  @PrimaryGeneratedColumn('uuid')
  id: Uuid;

  @Column({ type: 'varchar', length: 100 })
  action: string;

  @Column({ type: 'varchar', length: 50 })
  entityType: string;

  @Column({ type: 'uuid', nullable: true })
  entityId: Uuid | null;

  @Column({ type: 'uuid', nullable: true })
  actorId: Uuid | null;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  metadata: Record<string, unknown>;

  @Column({ type: 'varchar', length: 30, default: 'identity' })
  sourceService: 'identity' | 'tenancy';

  @Column({ type: 'timestamptz', default: () => 'now()' })
  occurredAt: Date;

  @Column({ type: 'text', nullable: true })
  sourceEventId: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
