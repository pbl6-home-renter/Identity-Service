import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { UserDirectoryListInput } from '../../../application/queries/user-directory-list/user-directory-list.query';

export class UserDirectoryListQueryRequestDto implements UserDirectoryListInput {
  @ApiPropertyOptional({
    description:
      'Từ khóa tên (1–100 ký tự sau khi trim); không phân biệt hoa/thường và dấu tiếng Việt',
    minLength: 0,
    maxLength: 100,
    example: 'Nguyen',
  })
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.normalize('NFC').trim() || undefined
      : value,
  )
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageNo: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 20;
}
