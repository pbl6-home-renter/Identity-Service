import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { OffsetPaginationQueryRequestDto } from 'shared/presentation/pagination/offset-pagination.request.dto';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { UserStatus } from 'shared/domain/enums/user-status.enum';
import {
  USER_SORT_FIELDS,
  UserSortField,
} from '../constants/user-sort-field.constant';

export class UserListAdminQueryRequestDto extends OffsetPaginationQueryRequestDto {
  @ApiPropertyOptional({
    description: 'Trường sắp xếp được phép',
    enum: USER_SORT_FIELDS,
    default: 'createdAt',
    example: 'createdAt',
  })
  @IsOptional()
  @IsString()
  @IsIn(USER_SORT_FIELDS, {
    message: `sort must be one of: ${USER_SORT_FIELDS.join(', ')}`,
  })
  override sort?: UserSortField = 'createdAt';

  @ApiPropertyOptional({
    description: 'Lọc theo vai trò',
    enum: UserRole,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    description: 'Lọc theo trạng thái',
    enum: UserStatus,
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({
    description: 'Tìm kiếm theo tên, email hoặc số điện thoại',
    example: 'an',
  })
  @IsOptional()
  @IsString()
  q?: string;
}
