import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from 'shared/infra/typeorm/persistence/type-orm.abstract.entity';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { UserEntity } from 'modules/users/infra/persistence/user.entity';

@Entity('landlord_profiles')
export class LandlordProfileEntity extends BaseEntity {
  @Column({
    type: 'uuid',
    unique: true,
    name: 'user_id',
  })
  userId: Uuid;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    name: 'bank_code',
  })
  bankCode?: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    name: 'account_number',
  })
  accountNumber?: string | null;

  @Column({
    type: 'varchar',
    length: 254,
    nullable: true,
    name: 'account_name',
  })
  accountName?: string | null;

  @OneToOne(() => UserEntity, (user) => user.landlordProfile, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}
