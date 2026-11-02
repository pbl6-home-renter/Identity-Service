import { Inject, Injectable } from '@nestjs/common';
import { INTERNAL_HTTP_DI_TOKEN } from 'shared/application/di-tokens';
import { PeerServiceRequestException } from 'shared/application/http/peer-service.exception';
import { PeerService } from 'shared/application/http/peer-service.enum';
import { IInternalHttpClient } from 'shared/application/ports/internal-http-client.port';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { IMediaOwnerResolver } from '../../application/ports/media-owner-resolver.port';
import { MediaOwnerType } from '../../domain/enums/media-owner-type.enum';
import { OwnerSnapshot } from '../../domain/value-objects/owner-snapshot';

interface CommunityConversationOwnership {
  landlordId: null;
  participantUserIds: Uuid[];
  status: null;
}

/** Checks chat membership and media visibility against Community-Service. */
@Injectable()
export class CommunityConversationOwnerResolver implements IMediaOwnerResolver {
  constructor(
    @Inject(INTERNAL_HTTP_DI_TOKEN.CLIENT)
    private readonly client: IInternalHttpClient,
  ) {}

  async resolve(
    ownerType: MediaOwnerType,
    ownerId: Uuid,
    actorUserId?: Uuid,
    mediaId?: Uuid,
  ): Promise<OwnerSnapshot | null> {
    if (!actorUserId) {
      return null;
    }

    try {
      const ownership = await this.client.get<CommunityConversationOwnership>(
        PeerService.COMMUNITY,
        `/internal/ownership/conversation/${ownerId}`,
        { query: { actorUserId, mediaId } },
      );
      return { ownerType, ownerId, ...ownership };
    } catch (error) {
      if (
        error instanceof PeerServiceRequestException &&
        error.statusCode === 404
      ) {
        return null;
      }
      throw error;
    }
  }
}
