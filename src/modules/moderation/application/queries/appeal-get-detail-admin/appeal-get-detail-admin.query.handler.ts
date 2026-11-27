import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { AppealNotFoundException } from '../../../domain/exceptions/appeal-not-found.exception';
import { MODERATION_DI_TOKEN } from '../../../moderation.di-token';
import { IModerationQueryService } from '../../ports/moderation-query-service.port';
import { AppealDetailModel } from '../models/appeal.model';
import { AppealGetDetailAdminQuery } from './appeal-get-detail-admin.query';

@QueryHandler(AppealGetDetailAdminQuery)
export class AppealGetDetailAdminQueryHandler implements IQueryHandler<
  AppealGetDetailAdminQuery,
  AppealDetailModel
> {
  constructor(
    @Inject(MODERATION_DI_TOKEN.QUERY_SERVICE)
    private readonly queryService: IModerationQueryService,
  ) {}

  async execute({
    appealId,
  }: AppealGetDetailAdminQuery): Promise<AppealDetailModel> {
    const found = await this.queryService.findAppealById(appealId);
    if (!found) throw new AppealNotFoundException();
    return found;
  }
}
