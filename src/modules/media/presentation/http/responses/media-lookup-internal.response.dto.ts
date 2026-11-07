import { ApiProperty } from '@nestjs/swagger';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { MediaLookupInternalResult } from '../../../application/queries/media-lookup-internal/media-lookup-internal.query.handler';

export class MediaLookupInternalResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: Uuid;

  @ApiProperty()
  ownerType: string;

  @ApiProperty({ format: 'uuid' })
  ownerId: Uuid;

  @ApiProperty()
  purpose: string;

  @ApiProperty()
  status: string;

  @ApiProperty({
    description: 'Public URL or authenticated Identity media path.',
  })
  url: string;

  static fromResult(
    result: MediaLookupInternalResult,
  ): MediaLookupInternalResponseDto {
    const dto = new MediaLookupInternalResponseDto();
    dto.id = result.id;
    dto.ownerType = result.ownerType;
    dto.ownerId = result.ownerId;
    dto.purpose = result.purpose;
    dto.status = result.status;
    dto.url = result.url;
    return dto;
  }
}
