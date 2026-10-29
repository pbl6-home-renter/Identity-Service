import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { MediaCaptureSource } from '../enums/media-capture-source.enum';
import { MediaContentType } from '../enums/media-content-type.enum';
import { MediaFileType } from '../enums/media-file-type.enum';
import { MediaOwnerType } from '../enums/media-owner-type.enum';
import { MediaPurpose } from '../enums/media-purpose.enum';
import { MediaStatus } from '../enums/media-status.enum';
import { MediaVisibility } from '../enums/media-visibility.enum';

export interface MediaProps {
  id?: Uuid;
  ownerType: MediaOwnerType;
  ownerId: Uuid;
  purpose: MediaPurpose;
  visibility: MediaVisibility;
  fileType: MediaFileType;
  contentType: MediaContentType;
  fileName: string;
  sizeBytes: number;
  captureSource: MediaCaptureSource | null;
  uploaderId: Uuid;
  storageKey: string;
  status: MediaStatus;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
  isDeleted?: boolean;
}

/** What the client declares when asking for an upload ticket. */
export interface MediaUploadRequest {
  ownerType: MediaOwnerType;
  ownerId: Uuid;
  purpose: MediaPurpose;
  fileName: string;
  /** Raw MIME type from the client, checked against the purpose policy. */
  contentType: string;
  sizeBytes: number;
  captureSource: MediaCaptureSource | null;
  uploaderId: Uuid;
}

export interface MediaUploadLimits {
  maxSizeBytes: number;
  ticketTtlSeconds: number;
}

/** Metadata of the object actually found in storage. */
export interface StoredFile {
  sizeBytes: number;
  contentType: string;
}
