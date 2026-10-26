import { Inject, Injectable } from '@nestjs/common';
import { INTERNAL_HTTP_DI_TOKEN } from 'shared/application/di-tokens';
import { PeerService } from 'shared/application/http/peer-service.enum';
import { IInternalHttpClient } from 'shared/application/ports/internal-http-client.port';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import {
  ITenancyUserStatsService,
  UserTenancyStats,
} from '../../application/ports/tenancy-user-stats.port';

@Injectable()
export class TenancyUserStatsService implements ITenancyUserStatsService {
  constructor(
    @Inject(INTERNAL_HTTP_DI_TOKEN.CLIENT)
    private readonly client: IInternalHttpClient,
  ) {}

  getUserStats(userId: Uuid): Promise<UserTenancyStats> {
    return this.client.get<UserTenancyStats>(
      PeerService.TENANCY,
      `/internal/users/${userId}/stats`,
    );
  }
}
