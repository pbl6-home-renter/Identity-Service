import { Inject, Injectable } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { UserDeletedEvent } from 'modules/users/use-case/events/implements/user-deleted.event';
import { ILandlordProfileRepository } from '../../../domain/repositories/landlord-profile.repository.interface';
import { LANDLORD_PROFILES_DI_TOKEN } from '../../../landlord-profiles.di-token';

@Injectable()
@EventsHandler(UserDeletedEvent)
export class LandlordProfileSoftDeleteEventHandler implements IEventHandler<UserDeletedEvent> {
  constructor(
    @Inject(LANDLORD_PROFILES_DI_TOKEN.REPOSITORY)
    private readonly landlordProfileRepository: ILandlordProfileRepository,
  ) {}

  async handle(event: UserDeletedEvent): Promise<void> {
    await this.landlordProfileRepository.softDeleteByUserId(event.userId);
  }
}
