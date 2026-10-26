import { Uuid } from 'shared/domain/value-objects/uuid.vo';

/** Mirrors Tenancy-Service `GET /internal/users/{userId}/stats`. */
export interface UserTenancyStats {
  buildingCount: number;
  activeContractCount: number;
}

export interface ITenancyUserStatsService {
  /** Rejects with a `PeerService*Exception` when Tenancy cannot answer. */
  getUserStats(userId: Uuid): Promise<UserTenancyStats>;
}
