export interface UserStatsResult {
  readonly totalUsers: number;
  readonly byRole: {
    readonly admin: number;
    readonly landlord: number;
    readonly tenant: number;
  };
  readonly byStatus: {
    readonly active: number;
    readonly locked: number;
    readonly pendingVerification: number;
  };
  readonly generatedAt: string;
}
