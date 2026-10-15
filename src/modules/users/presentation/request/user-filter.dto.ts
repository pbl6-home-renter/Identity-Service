import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { UserStatus } from 'shared/domain/enums/user-status.enum';

export class UserFilterDto {
  @ApiPropertyOptional({ enum: UserRole, example: UserRole.TENANT })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ enum: UserStatus, example: UserStatus.ACTIVE })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({
    description: 'Search keyword for name, email, or phone (case-insensitive)',
    example: 'an',
  })
  @IsOptional()
  @IsString()
  q?: string;
}
