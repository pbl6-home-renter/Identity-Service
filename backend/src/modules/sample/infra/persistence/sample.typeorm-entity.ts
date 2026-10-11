import { Column, Entity } from 'typeorm';
import { BaseEntity } from 'shared/infra/typeorm/persistence/type-orm.abstract.entity';

@Entity('samples')
export class SampleTypeormEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;
}
