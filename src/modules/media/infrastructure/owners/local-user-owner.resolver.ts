import { Inject, Injectable } from '@nestjs/common';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { IUserRepository } from 'modules/users/domain/repositories/user.repository.interface';
import { USERS_DI_TOKEN } from 'modules/users/users.di-token';
import { IMediaOwnerResolver } from '../../application/ports/media-owner-resolver.port';
import { MediaOwnerType } from '../../domain/enums/media-owner-type.enum';
import { OwnerSnapshot } from '../../domain/value-objects/owner-snapshot';

/** Users live in this service, so they are read straight from the database. */
@Injectable()
export class LocalUserOwnerResolver implements IMediaOwnerResolver {
  constructor(
    @Inject(USERS_DI_TOKEN.REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async resolve(
    ownerType: MediaOwnerType,
    ownerId: Uuid,
  ): Promise<OwnerSnapshot | null> {
    const user = await this.userRepository.findById(ownerId);
    if (!user) {
      return null;
    }

    return {
      ownerType,
      ownerId: user.id,
      landlordId: null,
      participantUserIds: [],
      status: user.status,
    };
  }
}
