import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ArrayMaxSize, ArrayNotEmpty, IsArray } from 'class-validator';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { IsUuid } from 'shared/presentation/validators/is-uuid.decorator';

export const USER_LOOKUP_INTERNAL_MAX_IDS = 100;

export class UserLookupInternalQueryRequestDto {
  @ApiProperty({
    description: `Comma-separated user ids (max ${USER_LOOKUP_INTERNAL_MAX_IDS})`,
    type: String,
    example:
      '123e4567-e89b-12d3-a456-426614174000,223e4567-e89b-12d3-a456-426614174000',
  })
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean)
      : value,
  )
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(USER_LOOKUP_INTERNAL_MAX_IDS)
  @IsUuid('INVALID_UUID', { each: true })
  ids: Uuid[];
}
