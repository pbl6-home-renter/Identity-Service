import {
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Uuid } from 'shared/domain/value-objects/uuid.vo';

/**
 * Base Entity dung nhu trong database-design.md muc 2.0 Base Entity:
 * id: uuid, PK, default gen_random_uuid()
 * created_at: timestamptz, NOT NULL, default now()
 * updated_at: timestamptz, NOT NULL, default now()
 * is_deleted: boolean, NOT NULL, default false
 */
export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: Uuid;

  @CreateDateColumn({
    type: 'timestamptz',
    name: 'created_at',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
    name: 'updated_at',
  })
  updatedAt: Date;

  @Column({
    type: 'boolean',
    default: false,
    name: 'is_deleted',
  })
  isDeleted: boolean;
}

// Giu alias de tuong thich nguoc neu file cu import AbstractEntity
export { BaseEntity as AbstractEntity };
export { BaseEntity as BaseTypeormEntity };
