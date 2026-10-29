import { Inject, Injectable } from '@nestjs/common';
import { INTERNAL_HTTP_DI_TOKEN } from 'shared/application/di-tokens';
import { PeerServiceRequestException } from 'shared/application/http/peer-service.exception';
import { PeerService } from 'shared/application/http/peer-service.enum';
import { IInternalHttpClient } from 'shared/application/ports/internal-http-client.port';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { IMediaOwnerResolver } from '../../application/ports/media-owner-resolver.port';
import { MediaOwnerType } from '../../domain/enums/media-owner-type.enum';
import { OwnerSnapshot } from '../../domain/value-objects/owner-snapshot';

/** Mirrors Tenancy-Service `GET /internal/ownership/{ownerType}/{ownerId}`. */
interface TenancyOwnership {
  landlordId: Uuid | null;
  participantUserIds: Uuid[];
  status: string | null;
}

/** Buildings, rooms, contracts, contract members and meter readings. */
@Injectable()
export class TenancyOwnerResolver implements IMediaOwnerResolver {
  constructor(
    @Inject(INTERNAL_HTTP_DI_TOKEN.CLIENT)
    private readonly client: IInternalHttpClient,
  ) {}

  async resolve(
    ownerType: MediaOwnerType,
    ownerId: Uuid,
  ): Promise<OwnerSnapshot | null> {
    try {
      const ownership = await this.client.get<TenancyOwnership>(
        PeerService.TENANCY,
        `/internal/ownership/${ownerType}/${ownerId}`,
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
