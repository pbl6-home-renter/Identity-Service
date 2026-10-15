import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';
import { OffsetPaginationQueryRequestDto } from 'shared/presentation/pagination/offset-pagination.request.dto';
import {
  USER_SORT_FIELDS,
  UserSortField,
} from '../constants/user-sort-field.constant';
import { UserFilterDto } from './user-filter.dto';

export class UserListAdminQueryRequestDto extends OffsetPaginationQueryRequestDto<UserFilterDto> {
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

  @ApiPropertyOptional({ type: UserFilterDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UserFilterDto)
  declare filter?: UserFilterDto;
}
