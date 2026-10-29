import { AggregateRoot } from 'shared/domain/base/aggregate-root';
import { generateUuid, Uuid } from 'shared/domain/value-objects/uuid.vo';
import {
  CONTENT_TYPE_EXTENSIONS,
  CONTENT_TYPE_FILE_TYPES,
} from '../constants/media-content-type.constant';
import { MediaCaptureSource } from '../enums/media-capture-source.enum';
import { MediaContentType } from '../enums/media-content-type.enum';
import { MediaFileType } from '../enums/media-file-type.enum';
import { MediaOwnerType } from '../enums/media-owner-type.enum';
import { MediaPurpose } from '../enums/media-purpose.enum';
import { MediaStatus } from '../enums/media-status.enum';
import { MediaVisibility } from '../enums/media-visibility.enum';
import { MediaDeletedException } from '../exceptions/media-deleted.exception';
import { MediaInvalidPurposeException } from '../exceptions/media-invalid-purpose.exception';
import { MediaNotFoundException } from '../exceptions/media-not-found.exception';
import { MediaTicketExpiredException } from '../exceptions/media-ticket-expired.exception';
import { MediaTypeNotAllowedException } from '../exceptions/media-type-not-allowed.exception';
import {
  MediaPurposePolicy,
  policyOf,
} from '../policies/media-purpose.policies';
import {
  MediaProps,
  MediaUploadLimits,
  MediaUploadRequest,
  StoredFile,
} from './media.props';

/**
 * A file attached to any entity of the system (polymorphic owner). The file
 * itself lives in object storage under `storageKey`; this aggregate tracks
 * its upload lifecycle: requested → uploaded → deleted.
 */
export class Media extends AggregateRoot {
  private constructor(
    readonly ownerType: MediaOwnerType,
    readonly ownerId: Uuid,
    readonly purpose: MediaPurpose,
    readonly visibility: MediaVisibility,
    readonly fileType: MediaFileType,
    readonly contentType: MediaContentType,
    readonly fileName: string,
    readonly sizeBytes: number,
    readonly captureSource: MediaCaptureSource | null,
    readonly uploaderId: Uuid,
    readonly storageKey: string,
    private _status: MediaStatus,
    readonly expiresAt: Date,
    id: Uuid,
    createdAt: Date,
    updatedAt: Date,
    isDeleted: boolean,
  ) {
    super(id, createdAt, updatedAt, isDeleted);
  }

  get status(): MediaStatus {
    return this._status;
  }

  get isUploaded(): boolean {
    return this._status === MediaStatus.UPLOADED;
  }

  get isPublic(): boolean {
    return this.visibility === MediaVisibility.PUBLIC;
  }

  get policy(): MediaPurposePolicy {
    return policyOf(this.purpose);
  }

  static requestUpload(
    request: MediaUploadRequest,
    limits: MediaUploadLimits,
  ): Media {
    const policy = policyOf(request.purpose);
    if (!policy.ownerTypes.includes(request.ownerType)) {
      throw new MediaInvalidPurposeException();
    }

    const contentType = Media.acceptFile(request, policy, limits);
    const id = generateUuid();
    const extension = CONTENT_TYPE_EXTENSIONS[contentType][0];

    return Media.reconstitute({
      id,
      ownerType: request.ownerType,
      ownerId: request.ownerId,
      purpose: request.purpose,
      visibility: policy.visibility,
      fileType: CONTENT_TYPE_FILE_TYPES[contentType],
      contentType,
      fileName: request.fileName,
      sizeBytes: request.sizeBytes,
      captureSource: request.captureSource,
      uploaderId: request.uploaderId,
      storageKey: `${request.ownerType}/${request.ownerId}/${id}.${extension}`,
      status: MediaStatus.PENDING_UPLOAD,
      expiresAt: new Date(Date.now() + limits.ticketTtlSeconds * 1000),
    });
  }

  static reconstitute(props: MediaProps): Media {
    return new Media(
      props.ownerType,
      props.ownerId,
      props.purpose,
      props.visibility,
      props.fileType,
      props.contentType,
      props.fileName,
      props.sizeBytes,
      props.captureSource,
      props.uploaderId,
      props.storageKey,
      props.status,
      props.expiresAt,
      props.id ?? generateUuid(),
      props.createdAt ?? new Date(),
      props.updatedAt ?? new Date(),
      props.isDeleted ?? false,
    );
  }

  /** Throws unless the upload ticket can still be completed. */
  ensureCompletable(now: Date = new Date()): void {
    if (this.isDeleted) {
      throw new MediaDeletedException();
    }
    if (!this.isUploaded && now > this.expiresAt) {
      throw new MediaTicketExpiredException();
    }
  }

  /** Throws unless the file is in storage and still live. */
  ensureReadable(): void {
    if (this.isDeleted) {
      throw new MediaDeletedException();
    }
    if (!this.isUploaded) {
      throw new MediaNotFoundException();
    }
  }

  /** The stored object must be exactly what the ticket was issued for. */
  matches(file: StoredFile): boolean {
    return (
      file.sizeBytes === this.sizeBytes && file.contentType === this.contentType
    );
  }

  markUploaded(): void {
    this._status = MediaStatus.UPLOADED;
  }

  delete(): void {
    if (this.isDeleted) {
      throw new MediaDeletedException();
    }
    this.markAsDeleted();
  }

  private static acceptFile(
    request: MediaUploadRequest,
    policy: MediaPurposePolicy,
    limits: MediaUploadLimits,
  ): MediaContentType {
    const contentType = policy.contentTypes.find(
      (allowed) => allowed === request.contentType,
    );
    const extension = request.fileName.split('.').pop()?.toLowerCase() ?? '';
    const sizeAllowed =
      request.sizeBytes > 0 && request.sizeBytes <= limits.maxSizeBytes;

    if (
      !contentType ||
      !CONTENT_TYPE_EXTENSIONS[contentType].includes(extension) ||
      !sizeAllowed
    ) {
      throw new MediaTypeNotAllowedException();
    }
    return contentType;
  }
}
