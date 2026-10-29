import { Media } from '../../../domain/entities/media';
import { MediaEntity } from '../media.typeorm-entity';

export class MediaMapper {
  static toDomain(raw: MediaEntity): Media {
    return Media.reconstitute({
      id: raw.id,
      ownerType: raw.ownerType,
      ownerId: raw.ownerId,
      purpose: raw.purpose,
      visibility: raw.visibility,
      fileType: raw.fileType,
      contentType: raw.contentType,
      fileName: raw.fileName,
      sizeBytes: raw.sizeBytes,
      captureSource: raw.captureSource,
      uploaderId: raw.uploaderId,
      storageKey: raw.storageKey,
      status: raw.status,
      expiresAt: raw.expiresAt,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      isDeleted: raw.isDeleted,
    });
  }

  static toPersistence(domain: Media): MediaEntity {
    const raw = new MediaEntity();
    raw.id = domain.id;
    raw.ownerType = domain.ownerType;
    raw.ownerId = domain.ownerId;
    raw.purpose = domain.purpose;
    raw.visibility = domain.visibility;
    raw.fileType = domain.fileType;
    raw.contentType = domain.contentType;
    raw.fileName = domain.fileName;
    raw.sizeBytes = domain.sizeBytes;
    raw.captureSource = domain.captureSource;
    raw.uploaderId = domain.uploaderId;
    raw.storageKey = domain.storageKey;
    raw.status = domain.status;
    raw.expiresAt = domain.expiresAt;
    raw.createdAt = domain.createdAt;
    raw.updatedAt = domain.updatedAt;
    raw.isDeleted = domain.isDeleted;
    return raw;
  }
}
