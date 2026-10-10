import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserTypeormEntity } from './user.typeorm-entity';

@Entity('landlord_profiles')
export class LandlordProfileTypeormEntity {
  @PrimaryColumn({ type: 'uuid', name: 'user_id' })
  userId: string;

  @OneToOne(() => UserTypeormEntity, (user) => user.landlordProfile, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user?: UserTypeormEntity;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    name: 'bank_code',
  })
  bankCode: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    name: 'account_number',
  })
  accountNumber: string | null;

  @Column({
    type: 'varchar',
    length: 254,
    nullable: true,
    name: 'account_name',
  })
  accountName: string | null;

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
}
