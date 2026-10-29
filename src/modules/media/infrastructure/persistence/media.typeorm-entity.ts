import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from 'shared/infrastructure/database/abstract.typeorm-entity';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { UserEntity } from 'modules/users/infrastructure/persistence/user.typeorm-entity';
import { MediaCaptureSource } from '../../domain/enums/media-capture-source.enum';
import { MediaContentType } from '../../domain/enums/media-content-type.enum';
import { MediaFileType } from '../../domain/enums/media-file-type.enum';
import { MediaOwnerType } from '../../domain/enums/media-owner-type.enum';
import { MediaPurpose } from '../../domain/enums/media-purpose.enum';
import { MediaStatus } from '../../domain/enums/media-status.enum';
import { MediaVisibility } from '../../domain/enums/media-visibility.enum';

@Entity('media')
@Index('IDX_media_owner', ['ownerType', 'ownerId'])
@Index('UQ_media_single_per_owner', ['ownerType', 'ownerId', 'purpose'], {
  unique: true,
  where: `"purpose" IN ('avatar', 'cover_photo') AND "status" = 'uploaded' AND "is_deleted" = false`,
})
export class MediaEntity extends AbstractEntity {
  @Column({ type: 'enum', enum: MediaOwnerType, name: 'owner_type' })
  ownerType: MediaOwnerType;

  @Column({ type: 'uuid', name: 'owner_id' })
  ownerId: Uuid;

  @Column({ type: 'enum', enum: MediaPurpose })
  purpose: MediaPurpose;

  @Column({ type: 'enum', enum: MediaVisibility })
  visibility: MediaVisibility;

  @Column({
    type: 'enum',
    enum: MediaFileType,
    name: 'file_type',
    default: MediaFileType.IMAGE,
  })
  fileType: MediaFileType;

  @Column({ type: 'enum', enum: MediaContentType, name: 'content_type' })
  contentType: MediaContentType;

  @Column({ type: 'varchar', length: 255, name: 'file_name' })
  fileName: string;

  /** Uploads are capped far below 2 GB, so `integer` is enough. */
  @Column({ type: 'integer', name: 'size_bytes' })
  sizeBytes: number;

  @Column({
    type: 'enum',
    enum: MediaCaptureSource,
    name: 'capture_source',
    nullable: true,
  })
  captureSource: MediaCaptureSource | null;

  @Column({ type: 'uuid', name: 'user_id' })
  uploaderId: Uuid;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  uploader?: UserEntity;

  @Column({ type: 'varchar', length: 512, name: 'storage_key', unique: true })
  storageKey: string;

  @Column({
    type: 'enum',
    enum: MediaStatus,
    default: MediaStatus.PENDING_UPLOAD,
  })
  status: MediaStatus;

  @Column({ type: 'timestamptz', name: 'expires_at' })
  expiresAt: Date;
}
