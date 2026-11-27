import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaginatedResult } from 'shared/application/pagination/paginated-result';
import { MODERATION_DI_TOKEN } from '../../../moderation.di-token';
import { IModerationQueryService } from '../../ports/moderation-query-service.port';
import { AppealListItemModel } from '../models/appeal.model';
import { AppealListAdminQuery } from './appeal-list-admin.query';

@QueryHandler(AppealListAdminQuery)
export class AppealListAdminQueryHandler implements IQueryHandler<
  AppealListAdminQuery,
  PaginatedResult<AppealListItemModel>
> {
  constructor(
    @Inject(MODERATION_DI_TOKEN.QUERY_SERVICE)
    private readonly queryService: IModerationQueryService,
  ) {}

  execute({
    search,
  }: AppealListAdminQuery): Promise<PaginatedResult<AppealListItemModel>> {
    return this.queryService.findAppeals(search);
  }
}
