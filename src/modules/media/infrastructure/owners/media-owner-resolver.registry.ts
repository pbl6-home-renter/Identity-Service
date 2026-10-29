import { Injectable } from '@nestjs/common';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { IMediaOwnerResolver } from '../../application/ports/media-owner-resolver.port';
import { MediaOwnerType } from '../../domain/enums/media-owner-type.enum';
import { OwnerSnapshot } from '../../domain/value-objects/owner-snapshot';
import { LocalUserOwnerResolver } from './local-user-owner.resolver';
import { TenancyOwnerResolver } from './tenancy-owner.resolver';
import { UnavailableOwnerResolver } from './unavailable-owner.resolver';

/** Routes each owner type to the service that owns it. */
@Injectable()
export class MediaOwnerResolverRegistry implements IMediaOwnerResolver {
  private readonly resolvers: Readonly<
    Record<MediaOwnerType, IMediaOwnerResolver>
  >;

  constructor(
    user: LocalUserOwnerResolver,
    tenancy: TenancyOwnerResolver,
    community: UnavailableOwnerResolver,
  ) {
    this.resolvers = {
      [MediaOwnerType.USER]: user,
      [MediaOwnerType.BUILDING]: tenancy,
      [MediaOwnerType.ROOM]: tenancy,
      [MediaOwnerType.CONTRACT]: tenancy,
      [MediaOwnerType.CONTRACT_MEMBER]: tenancy,
      [MediaOwnerType.METER_READING]: tenancy,
      [MediaOwnerType.ISSUE_REPORT]: community,
      [MediaOwnerType.MESSAGE]: community,
    };
  }

  resolve(
    ownerType: MediaOwnerType,
    ownerId: Uuid,
  ): Promise<OwnerSnapshot | null> {
    return this.resolvers[ownerType].resolve(ownerType, ownerId);
  }
}
