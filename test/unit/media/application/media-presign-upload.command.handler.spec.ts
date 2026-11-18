import { MediaPresignUploadCommandHandler } from 'modules/media/application/commands/media-presign-upload/media-presign-upload.command.handler';
import { MediaPresignUploadCommand } from 'modules/media/application/commands/media-presign-upload/media-presign-upload.command';
import { Media } from 'modules/media/domain/entities/media';
import { MediaContentType } from 'modules/media/domain/enums/media-content-type.enum';
import { MediaOwnerType } from 'modules/media/domain/enums/media-owner-type.enum';
import { MediaPurpose } from 'modules/media/domain/enums/media-purpose.enum';
import { MediaOwnerFileLimitExceededException } from 'modules/media/domain/exceptions/media-owner-file-limit-exceeded.exception';
import { MediaAccessService } from 'modules/media/application/services/media-access.service';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { generateUuid } from 'shared/domain/value-objects/uuid.vo';

describe('MediaPresignUploadCommandHandler', () => {
  it('limits issue media to five live files, including pending tickets', async () => {
    const actor = { id: generateUuid(), role: UserRole.TENANT };
    const ownerId = generateUuid();
    const existing = Array.from({ length: 5 }, () =>
      Media.requestUpload(
        {
          ownerType: MediaOwnerType.ISSUE_REPORT,
          ownerId,
          purpose: MediaPurpose.ISSUE_PHOTO,
          fileName: 'evidence.mp4',
          contentType: MediaContentType.MP4,
          sizeBytes: 512,
          captureSource: null,
          uploaderId: actor.id,
        },
        { maxSizeBytes: 1024, ticketTtlSeconds: 60 },
      ),
    );
    const repository = {
      findByOwner: jest.fn(async () => existing),
      save: jest.fn(),
    };
    const access = new MediaAccessService({
      resolve: jest.fn(async () => ({
        ownerType: MediaOwnerType.ISSUE_REPORT,
        ownerId,
        landlordId: null,
        participantUserIds: [actor.id],
        status: 'open',
      })),
    });
    const handler = new MediaPresignUploadCommandHandler(
      repository as never,
      { createUploadUrl: jest.fn() } as never,
      { maxSizeBytes: 1024, ticketTtlSeconds: 60 },
      access,
    );

    const command = MediaPresignUploadCommand.create(actor, {
      ownerType: MediaOwnerType.ISSUE_REPORT,
      ownerId,
      purpose: MediaPurpose.ISSUE_PHOTO,
      fileName: 'new.mp4',
      contentType: MediaContentType.MP4,
      size: 512,
    });

    await expect(handler.execute(command)).rejects.toThrow(
      MediaOwnerFileLimitExceededException,
    );
    expect(repository.save).not.toHaveBeenCalled();
  });
});
