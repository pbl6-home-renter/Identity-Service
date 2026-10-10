import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserTypeormEntity } from '../../../users/infra/persistence/user.typeorm-entity';

@Entity('refresh_tokens')
export class RefreshTokenTypeormEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ManyToOne(() => UserTypeormEntity, (user) => user.refreshTokens, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user?: UserTypeormEntity;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'token_hash',
  })
  tokenHash: string;

  @Column({
    type: 'uuid',
    name: 'family_id',
  })
  familyId: string;

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
  revokedAt: Date | null;

  @CreateDateColumn({
    type: 'timestamptz',
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;
}
