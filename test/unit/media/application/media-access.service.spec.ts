import { MediaAccessService } from 'modules/media/application/services/media-access.service';
import { IMediaOwnerResolver } from 'modules/media/application/ports/media-owner-resolver.port';
import { Media } from 'modules/media/domain/entities/media';
import { MediaCaptureSource } from 'modules/media/domain/enums/media-capture-source.enum';
import { MediaContentType } from 'modules/media/domain/enums/media-content-type.enum';
import { MediaOwnerType } from 'modules/media/domain/enums/media-owner-type.enum';
import { MediaPurpose } from 'modules/media/domain/enums/media-purpose.enum';
import { MediaUnauthenticatedException } from 'modules/media/domain/exceptions/media-unauthenticated.exception';
import { MediaCannotDeleteException } from 'modules/media/domain/exceptions/media-cannot-delete.exception';
import { MediaForbiddenException } from 'modules/media/domain/exceptions/media-forbidden.exception';
import { OwnerSnapshot } from 'modules/media/domain/value-objects/owner-snapshot';
import { MediaActor } from 'modules/media/domain/value-objects/media-actor';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { generateUuid } from 'shared/domain/value-objects/uuid.vo';

function createMedia(input: {
  purpose: MediaPurpose;
  ownerType: MediaOwnerType;
  uploaderId: ReturnType<typeof generateUuid>;
  ownerId?: ReturnType<typeof generateUuid>;
}) {
  return Media.requestUpload(
    {
      ownerType: input.ownerType,
      ownerId: input.ownerId ?? generateUuid(),
      purpose: input.purpose,
      fileName: 'evidence.jpg',
      contentType: MediaContentType.JPEG,
      sizeBytes: 512,
      captureSource: MediaCaptureSource.CAMERA_DIRECT,
      uploaderId: input.uploaderId,
    },
    { maxSizeBytes: 1024, ticketTtlSeconds: 60 },
  );
}

describe('MediaAccessService', () => {
  it('rechecks issue access for the uploader when reading or completing a photo', async () => {
    const actor: MediaActor = { id: generateUuid(), role: UserRole.TENANT };
    const ownerId = generateUuid();
    let owner: OwnerSnapshot = {
      ownerType: MediaOwnerType.ISSUE_REPORT,
      ownerId,
      landlordId: null,
      participantUserIds: [actor.id],
      status: 'open',
    };
    const resolver: IMediaOwnerResolver = {
      resolve: jest.fn(async () => owner),
    };
    const service = new MediaAccessService(resolver);
    const photo = createMedia({
      purpose: MediaPurpose.ISSUE_PHOTO,
      ownerType: MediaOwnerType.ISSUE_REPORT,
      ownerId,
      uploaderId: actor.id,
    });

    await service.assertCanComplete(actor, photo);
    await service.assertCanRead(actor, photo);
    owner = { ...owner, participantUserIds: [] };
    await expect(service.assertCanComplete(actor, photo)).rejects.toThrow(
      MediaForbiddenException,
    );
    await expect(service.assertCanRead(actor, photo)).rejects.toThrow(
      MediaForbiddenException,
    );
  });

  it('does not let another authorized participant complete an upload', async () => {
    const actor: MediaActor = { id: generateUuid(), role: UserRole.TENANT };
    const resolver: IMediaOwnerResolver = {
      resolve: jest.fn(async () => null),
    };
    const service = new MediaAccessService(resolver);
    const photo = createMedia({
      purpose: MediaPurpose.ISSUE_PHOTO,
      ownerType: MediaOwnerType.ISSUE_REPORT,
      uploaderId: generateUuid(),
    });
    await expect(service.assertCanComplete(actor, photo)).rejects.toThrow(
      MediaForbiddenException,
    );
    expect(resolver.resolve).not.toHaveBeenCalled();
  });

  it('resolves the owner for upload authorization and skips lookup for ordinary completion', async () => {
    const actor: MediaActor = { id: generateUuid(), role: UserRole.TENANT };
    const owner: OwnerSnapshot = {
      ownerType: MediaOwnerType.USER,
      ownerId: actor.id,
      landlordId: null,
      participantUserIds: [actor.id],
      status: null,
    };
    const resolver: IMediaOwnerResolver = {
      resolve: jest.fn(async () => owner),
    };
    const service = new MediaAccessService(resolver);
    const avatar = createMedia({
      purpose: MediaPurpose.AVATAR,
      ownerType: MediaOwnerType.USER,
      ownerId: actor.id,
      uploaderId: actor.id,
    });

    await service.assertCanUpload(actor, avatar);
    expect(resolver.resolve).toHaveBeenCalledWith(
      MediaOwnerType.USER,
      actor.id,
      actor.id,
      undefined,
    );
    await service.assertCanComplete(actor, avatar);
    expect(resolver.resolve).toHaveBeenCalledTimes(1);
  });

  it('returns public reads without an owner call and distinguishes unauthenticated private reads', async () => {
    const resolver: IMediaOwnerResolver = {
      resolve: jest.fn(async () => null),
    };
    const service = new MediaAccessService(resolver);
    const publicMedia = createMedia({
      purpose: MediaPurpose.AVATAR,
      ownerType: MediaOwnerType.USER,
      uploaderId: generateUuid(),
    });
    await service.assertCanRead(null, publicMedia);

    const privateMedia = createMedia({
      purpose: MediaPurpose.OWNERSHIP_PROOF,
      ownerType: MediaOwnerType.BUILDING,
      uploaderId: generateUuid(),
    });
    await expect(service.assertCanRead(null, privateMedia)).rejects.toThrow(
      MediaUnauthenticatedException,
    );
    expect(resolver.resolve).not.toHaveBeenCalled();
  });

  it('prevents deletion of ownership evidence after its owner is approved', async () => {
    const actor: MediaActor = { id: generateUuid(), role: UserRole.LANDLORD };
    const owner: OwnerSnapshot = {
      ownerType: MediaOwnerType.BUILDING,
      ownerId: generateUuid(),
      landlordId: actor.id,
      participantUserIds: [],
      status: 'approved',
    };
    const resolver: IMediaOwnerResolver = {
      resolve: jest.fn(async () => owner),
    };
    const service = new MediaAccessService(resolver);
    const proof = createMedia({
      purpose: MediaPurpose.OWNERSHIP_PROOF,
      ownerType: MediaOwnerType.BUILDING,
      uploaderId: actor.id,
      ownerId: owner.ownerId,
    });

    await expect(service.assertCanDelete(actor, proof)).rejects.toThrow(
      MediaCannotDeleteException,
    );
    expect(resolver.resolve).toHaveBeenCalledWith(
      MediaOwnerType.BUILDING,
      owner.ownerId,
      undefined,
      undefined,
    );
  });
});
