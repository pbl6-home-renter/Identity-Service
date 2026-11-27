import { IQuery } from '@nestjs/cqrs';
import { AppealSearch } from '../../ports/moderation-query-service.port';

export class AppealListAdminQuery implements IQuery {
  constructor(readonly search: AppealSearch) {}
}
