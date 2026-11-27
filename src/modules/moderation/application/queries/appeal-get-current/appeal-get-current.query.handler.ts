import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UserStatus } from 'shared/domain/enums/user-status.enum';
import { IUserRepository } from 'modules/users/domain/repositories/user.repository.interface';
import { UserNotFoundException } from 'modules/users/domain/exceptions/user-not-found.exception';
import { USERS_DI_TOKEN } from 'modules/users/users.di-token';
import { AccountAppeal } from '../../../domain/entities/account-appeal';
import { IAccountAppealRepository } from '../../../domain/repositories/account-appeal.repository.interface';
import { MODERATION_DI_TOKEN } from '../../../moderation.di-token';
import { AppealGetCurrentQuery } from './appeal-get-current.query';

export interface AppealCurrentResult {
  lockReason: string | null;
  lockedAt: Date | null;
  /** Latest appeal of the current lock period. */
  appeal: AccountAppeal | null;
  canSubmit: boolean;
  nextSubmitAt: Date | null;
}

@QueryHandler(AppealGetCurrentQuery)
export class AppealGetCurrentQueryHandler implements IQueryHandler<
  AppealGetCurrentQuery,
  AppealCurrentResult
> {
  constructor(
    @Inject(USERS_DI_TOKEN.REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(MODERATION_DI_TOKEN.APPEAL_REPOSITORY)
    private readonly appealRepository: IAccountAppealRepository,
  ) {}

  async execute({
    userId,
  }: AppealGetCurrentQuery): Promise<AppealCurrentResult> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new UserNotFoundException();
    if (user.status !== UserStatus.LOCKED || !user.lockedAt) {
      return {
        lockReason: null,
        lockedAt: null,
        appeal: null,
        canSubmit: false,
        nextSubmitAt: null,
      };
    }

    const appeal = await this.appealRepository.findLatestForLockPeriod(
      user.id,
      user.lockedAt,
    );
    const nextSubmitAt = AccountAppeal.nextSubmitAt(appeal);
    const waiting =
      nextSubmitAt !== null && nextSubmitAt.getTime() > Date.now();
    return {
      lockReason: user.lockReason,
      lockedAt: user.lockedAt,
      appeal,
      canSubmit: !appeal?.isPending && !waiting,
      nextSubmitAt: waiting ? nextSubmitAt : null,
    };
  }
}
