import { ApiProperty } from '@nestjs/swagger';
import { UserStatsResult } from '../../../application/results/user-stats.result';

class UserStatsByRoleDto {
  @ApiProperty({ minimum: 0, example: 1 })
  admin: number;

  @ApiProperty({ minimum: 0, example: 3 })
  landlord: number;

  @ApiProperty({ minimum: 0, example: 5 })
  tenant: number;
}

class UserStatsByStatusDto {
  @ApiProperty({ minimum: 0, example: 6 })
  active: number;

  @ApiProperty({ minimum: 0, example: 1 })
  locked: number;

  @ApiProperty({ minimum: 0, example: 2 })
  pendingVerification: number;
}

export class UserStatsResponseDto {
  @ApiProperty({ minimum: 0, example: 9 })
  totalUsers: number;

  @ApiProperty({ type: UserStatsByRoleDto })
  byRole: UserStatsByRoleDto;

  @ApiProperty({ type: UserStatsByStatusDto })
  byStatus: UserStatsByStatusDto;

  @ApiProperty({ format: 'date-time', example: '2026-11-21T09:30:00.000Z' })
  generatedAt: string;

  static fromResult(result: UserStatsResult): UserStatsResponseDto {
    const dto = new UserStatsResponseDto();
    dto.totalUsers = result.totalUsers;
    dto.byRole = result.byRole;
    dto.byStatus = result.byStatus;
    dto.generatedAt = result.generatedAt;
    return dto;
  }
}
