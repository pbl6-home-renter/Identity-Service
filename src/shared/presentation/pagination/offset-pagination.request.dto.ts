import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { IOffsetPaginationQueryRequestDto } from '../../domain/pagination/i-offset-pagination.query.request.dto';
import { SortOrder } from '../../domain/value-objects/sort-order.vo';

export class OffsetPaginationQueryRequestDto implements IOffsetPaginationQueryRequestDto {
  @ApiPropertyOptional({
    description: 'Số nguyên dương, bắt đầu từ 1',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageNo: number = 1;

  @ApiPropertyOptional({
    description: 'Số nguyên dương, tối đa 100',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 20;

  @ApiPropertyOptional({
    description:
      'Một field từ whitelist của endpoint; ví dụ: createdAt. Client chỉ gửi một sort, không chứa dấu phẩy.',
    example: 'createdAt',
  })
  @IsOptional()
  @IsString({ message: 'sort must be a single string' })
  @Matches(/^[^,]+$/, {
    message: 'sort cannot contain commas and must be a single field',
  })
  sort?: string;

  @ApiPropertyOptional({
    description: 'Thứ tự sắp xếp: asc hoặc desc (chỉ áp dụng cho sort)',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'], {
    message: 'order must be either asc or desc',
  })
  order?: SortOrder = 'desc';
}
