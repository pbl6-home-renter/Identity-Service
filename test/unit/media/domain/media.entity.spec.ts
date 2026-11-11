import { Media } from 'modules/media/domain/entities/media';
import {
  MediaUploadLimits,
  MediaUploadRequest,
} from 'modules/media/domain/entities/media.props';
import { MediaCaptureSource } from 'modules/media/domain/enums/media-capture-source.enum';
import { MediaContentType } from 'modules/media/domain/enums/media-content-type.enum';
import { MediaOwnerType } from 'modules/media/domain/enums/media-owner-type.enum';
import { MediaPurpose } from 'modules/media/domain/enums/media-purpose.enum';
import { MediaStatus } from 'modules/media/domain/enums/media-status.enum';
import { MediaVisibility } from 'modules/media/domain/enums/media-visibility.enum';
import { MediaDeletedException } from 'modules/media/domain/exceptions/media-deleted.exception';
import { MediaInvalidPurposeException } from 'modules/media/domain/exceptions/media-invalid-purpose.exception';
import { MediaNotFoundException } from 'modules/media/domain/exceptions/media-not-found.exception';
import { MediaTicketExpiredException } from 'modules/media/domain/exceptions/media-ticket-expired.exception';
import { MediaTypeNotAllowedException } from 'modules/media/domain/exceptions/media-type-not-allowed.exception';
import { MediaAccessPolicy } from 'modules/media/domain/policies/media-access-policy';
import { policyOf } from 'modules/media/domain/policies/media-purpose.policies';
import { MediaActor } from 'modules/media/domain/value-objects/media-actor';
import { OwnerSnapshot } from 'modules/media/domain/value-objects/owner-snapshot';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { generateUuid } from 'shared/domain/value-objects/uuid.vo';

const limits: MediaUploadLimits = {
  maxSizeBytes: 1024,
  ticketTtlSeconds: 60,
};

function uploadRequest(
  overrides: Partial<MediaUploadRequest> = {},
): MediaUploadRequest {
  return {
    ownerType: MediaOwnerType.USER,
    ownerId: generateUuid(),
    purpose: MediaPurpose.AVATAR,
    fileName: 'avatar.jpg',
    contentType: MediaContentType.JPEG,
    sizeBytes: 128,
    captureSource: null,
    uploaderId: generateUuid(),
    ...overrides,
  };
}

describe('Media upload lifecycle', () => {
  it('creates a pending ticket using the purpose policy and configured expiry', () => {
    const requestedAt = Date.now();
    const media = Media.requestUpload(uploadRequest(), limits);

    expect(media.status).toBe(MediaStatus.PENDING_UPLOAD);
    expect(media.visibility).toBe(MediaVisibility.PUBLIC);
    expect(media.expiresAt.getTime()).toBeGreaterThanOrEqual(
      requestedAt + 59_000,
    );
    expect(media.expiresAt.getTime()).toBeLessThanOrEqual(requestedAt + 61_000);
  });

  it('rejects a purpose attached to an unsupported owner type', () => {
    expect(() =>
      Media.requestUpload(
        uploadRequest({ ownerType: MediaOwnerType.BUILDING }),
        limits,
      ),
    ).toThrow(MediaInvalidPurposeException);
  });

  it.each([
    { fileName: 'avatar.svg', contentType: 'image/svg+xml', sizeBytes: 128 },
    {
      fileName: 'avatar.jpg',
      contentType: MediaContentType.JPEG,
      sizeBytes: 0,
    },
    {
      fileName: 'avatar.jpg',
      contentType: MediaContentType.JPEG,
      sizeBytes: 1025,
    },
  ])('rejects upload metadata outside the policy limits', (file) => {
    expect(() =>
      Media.requestUpload(
        uploadRequest(file as Partial<MediaUploadRequest>),
        limits,
      ),
    ).toThrow(MediaTypeNotAllowedException);
  });

  it('requires a live pending ticket and exact stored-object metadata', () => {
    const media = Media.requestUpload(uploadRequest(), limits);
    expect(
      media.matches({ sizeBytes: 128, contentType: MediaContentType.JPEG }),
    ).toBe(true);
    expect(
      media.matches({ sizeBytes: 127, contentType: MediaContentType.JPEG }),
    ).toBe(false);
    expect(() =>
      media.ensureCompletable(new Date(media.expiresAt.getTime() + 1)),
    ).toThrow(MediaTicketExpiredException);

    media.markUploaded();
    expect(media.isUploaded).toBe(true);
    expect(() => media.ensureReadable()).not.toThrow();
  });

  it('does not allow pending or deleted files to be read', () => {
    const pending = Media.requestUpload(uploadRequest(), limits);
    expect(() => pending.ensureReadable()).toThrow(MediaNotFoundException);

    pending.markUploaded();
    pending.delete();
    expect(() => pending.ensureReadable()).toThrow(MediaDeletedException);
    expect(() => pending.delete()).toThrow(MediaDeletedException);
  });
});

describe('Media access policy', () => {
  const uploaderId = generateUuid();
  const owner: OwnerSnapshot = {
    ownerType: MediaOwnerType.CONVERSATION,
    ownerId: generateUuid(),
    landlordId: null,
    participantUserIds: [uploaderId],
    status: null,
  };
  const uploader: MediaActor = { id: uploaderId, role: UserRole.TENANT };

  it('allows anonymous reads for public media and uploader reads for private media', () => {
    const publicMedia = Media.requestUpload(uploadRequest(), limits);
    const privateMedia = Media.requestUpload(
      uploadRequest({
        ownerType: MediaOwnerType.CONVERSATION,
        purpose: MediaPurpose.CHAT_ATTACHMENT,
        uploaderId,
      }),
      limits,
    );

    expect(MediaAccessPolicy.canReadWithoutOwner(null, publicMedia)).toBe(true);
    expect(MediaAccessPolicy.canReadWithoutOwner(uploader, privateMedia)).toBe(
      false,
    );
  });

  it('requires owner authorization and forbids generic deletion for chat attachments', () => {
    const policy = policyOf(MediaPurpose.CHAT_ATTACHMENT);
    const media = Media.requestUpload(
      uploadRequest({
        ownerType: MediaOwnerType.CONVERSATION,
        purpose: MediaPurpose.CHAT_ATTACHMENT,
        uploaderId,
      }),
      limits,
    );

    expect(policy.ownerAuthorizationRequired).toBe(true);
    expect(policy.allowDelete).toBe(false);
    expect(MediaAccessPolicy.canReadWithoutOwner(uploader, media)).toBe(false);
    expect(MediaAccessPolicy.canDelete(uploader, media)).toBe(false);
  });

  it('requires camera capture from meter-reading participants but permits landlords', () => {
    const policy = policyOf(MediaPurpose.METER_READING_EVIDENCE);
    const participant: MediaActor = { id: uploaderId, role: UserRole.TENANT };
    const landlordId = generateUuid();
    const ownerSnapshot: OwnerSnapshot = {
      ...owner,
      ownerType: MediaOwnerType.METER_READING,
      landlordId,
      participantUserIds: [uploaderId],
    };

    expect(
      policy.canUpload({
        actor: participant,
        owner: ownerSnapshot,
        captureSource: MediaCaptureSource.DEVICE_STORAGE,
      }),
    ).toBe(false);
    expect(
      policy.canUpload({
        actor: participant,
        owner: ownerSnapshot,
        captureSource: MediaCaptureSource.CAMERA_DIRECT,
      }),
    ).toBe(true);
    expect(
      policy.canUpload({
        actor: { id: landlordId, role: UserRole.LANDLORD },
        owner: ownerSnapshot,
        captureSource: MediaCaptureSource.DEVICE_STORAGE,
      }),
    ).toBe(true);
  });
});
