import { Inject, Injectable } from '@nestjs/common';
import { Media } from '../../domain/entities/media';
import { MediaCannotDeleteException } from '../../domain/exceptions/media-cannot-delete.exception';
import { MediaForbiddenException } from '../../domain/exceptions/media-forbidden.exception';
import { MediaUnauthenticatedException } from '../../domain/exceptions/media-unauthenticated.exception';
import { MediaAccessPolicy } from '../../domain/policies/media-access-policy';
import { MediaActor } from '../../domain/value-objects/media-actor';
import { OwnerSnapshot } from '../../domain/value-objects/owner-snapshot';
import { MEDIA_DI_TOKEN } from '../../media.di-token';
import { IMediaOwnerResolver } from '../ports/media-owner-resolver.port';

/**
 * The single entry point handlers use for permissions: it looks the owner up
 * only when a rule needs it, then defers to `MediaAccessPolicy`.
 */
@Injectable()
export class MediaAccessService {
  constructor(
    @Inject(MEDIA_DI_TOKEN.OWNER_RESOLVER)
    private readonly owners: IMediaOwnerResolver,
  ) {}

  async assertCanUpload(actor: MediaActor, media: Media): Promise<void> {
    const owner = await this.findOwner(media);
    if (!owner || !MediaAccessPolicy.canUpload(actor, media, owner)) {
      throw new MediaForbiddenException();
    }
  }

  assertCanComplete(actor: MediaActor, media: Media): void {
    if (!MediaAccessPolicy.canComplete(actor, media)) {
      throw new MediaForbiddenException();
    }
  }

  async assertCanRead(actor: MediaActor | null, media: Media): Promise<void> {
    if (MediaAccessPolicy.canReadWithoutOwner(actor, media)) {
      return;
    }

    if (!actor) {
      throw new MediaUnauthenticatedException();
    }

    const owner = await this.findOwner(media);
    if (!owner || !MediaAccessPolicy.canRead(actor, media, owner)) {
      throw new MediaForbiddenException();
    }
  }

  async assertCanDelete(actor: MediaActor, media: Media): Promise<void> {
    if (!MediaAccessPolicy.canDelete(actor, media)) {
      throw new MediaForbiddenException();
    }

    if (!media.policy.lockedOwnerStatuses) {
      return;
    }

    const owner = await this.findOwner(media);
    if (owner && MediaAccessPolicy.isKeptAsEvidence(media, owner)) {
      throw new MediaCannotDeleteException();
    }
  }

  private findOwner(media: Media): Promise<OwnerSnapshot | null> {
    return this.owners.resolve(media.ownerType, media.ownerId);
  }
}
