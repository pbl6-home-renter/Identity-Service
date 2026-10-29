import { Injectable } from '@nestjs/common';
import { IMediaOwnerResolver } from '../../application/ports/media-owner-resolver.port';
import { MediaOwnerUnavailableException } from '../../domain/exceptions/media-owner-unavailable.exception';
import { OwnerSnapshot } from '../../domain/value-objects/owner-snapshot';

/**
 * Issue reports and messages belong to Community-Service, which does not
 * exist yet. TODO: replace with a Community resolver once it is deployed.
 */
@Injectable()
export class UnavailableOwnerResolver implements IMediaOwnerResolver {
  resolve(): Promise<OwnerSnapshot | null> {
    return Promise.reject(new MediaOwnerUnavailableException());
  }
}
