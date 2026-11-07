import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';

export class MediaLookupInternalRequestDto {
  @ApiProperty({
    type: String,
    description: 'Comma-separated uploaded media UUIDs.',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',').filter(Boolean) : value,
  )
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('all', { each: true })
  ids: Uuid[];
}
