import { UserRole } from 'shared/domain/enums/user-role.enum';
import { Media } from '../entities/media';
import { MediaActor } from '../value-objects/media-actor';
import { OwnerSnapshot } from '../value-objects/owner-snapshot';

/**
 * Rules shared by every purpose. Purpose-specific rules live in
 * `MEDIA_PURPOSE_POLICIES`; this class only adds the overrides around them.
 */
export class MediaAccessPolicy {
  static canUpload(
    actor: MediaActor,
    media: Media,
    owner: OwnerSnapshot,
  ): boolean {
    return (
      isAdmin(actor) ||
      media.policy.canUpload({
        actor,
        owner,
        captureSource: media.captureSource,
      })
    );
  }

  static canComplete(actor: MediaActor, media: Media): boolean {
    return isUploader(actor, media);
  }

  /** Public files, admins and the uploader never need the owner looked up. */
  static canReadWithoutOwner(actor: MediaActor | null, media: Media): boolean {
    if (media.isPublic) {
      return true;
    }

    return actor !== null && (isAdmin(actor) || isUploader(actor, media));
  }

  static canRead(
    actor: MediaActor,
    media: Media,
    owner: OwnerSnapshot,
  ): boolean {
    return media.policy.canRead({ actor, owner });
  }

  static canDelete(actor: MediaActor, media: Media): boolean {
    return isAdmin(actor) || isUploader(actor, media);
  }

  /** e.g. the ownership proof of an approved building, the signed contract file. */
  static isKeptAsEvidence(media: Media, owner: OwnerSnapshot): boolean {
    const lockedStatuses = media.policy.lockedOwnerStatuses ?? [];

    return owner.status !== null && lockedStatuses.includes(owner.status);
  }
}

function isAdmin(actor: MediaActor): boolean {
  return actor.role === UserRole.ADMIN;
}

function isUploader(actor: MediaActor, media: Media): boolean {
  return media.uploaderId === actor.id;
}
