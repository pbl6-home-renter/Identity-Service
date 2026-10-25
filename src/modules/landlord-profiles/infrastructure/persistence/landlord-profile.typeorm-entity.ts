import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { AbstractEntity } from 'shared/infrastructure/database/abstract.typeorm-entity';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { UserEntity } from 'modules/users/infrastructure/persistence/user.typeorm-entity';

@Entity('landlord_profiles')
export class LandlordProfileEntity extends AbstractEntity {
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
