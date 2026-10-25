import { Inject, Injectable } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { UserDeletedEvent } from 'modules/users/domain/events/user-deleted.event';
import { UserLockedEvent } from 'modules/users/domain/events/user-locked.event';
import { UserPasswordChangedEvent } from 'modules/users/domain/events/user-password-changed.event';
import { IAuthRepository } from '../../domain/repositories/auth.repository.interface';
import { AUTH_DI_TOKEN } from '../../auth.di-token';

type UserTokenRevocationEvent =
  UserDeletedEvent | UserLockedEvent | UserPasswordChangedEvent;

@Injectable()
@EventsHandler(UserDeletedEvent, UserLockedEvent, UserPasswordChangedEvent)
export class AuthRevokeTokensOnUserEventsHandler implements IEventHandler<UserTokenRevocationEvent> {
  constructor(
    @Inject(AUTH_DI_TOKEN.REPOSITORY)
    private readonly authRepository: IAuthRepository,
  ) {}

  async handle(event: UserTokenRevocationEvent): Promise<void> {
    await this.authRepository.revokeActiveRefreshTokensByUserId(event.userId);
  }
}
