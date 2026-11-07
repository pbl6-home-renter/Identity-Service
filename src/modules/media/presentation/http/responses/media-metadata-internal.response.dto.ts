import { ApiProperty } from '@nestjs/swagger';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { MediaLookupInternalResult } from '../../../application/queries/media-lookup-internal/media-lookup-internal.query.handler';

/** Contract fixed by P6-D73 for service-to-service media validation. */
export class MediaMetadataInternalResponseDto {
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

  static fromResult(
    result: MediaLookupInternalResult,
  ): MediaMetadataInternalResponseDto {
    const dto = new MediaMetadataInternalResponseDto();
    dto.id = result.id;
    dto.ownerType = result.ownerType;
    dto.ownerId = result.ownerId;
    dto.purpose = result.purpose;
    dto.status = result.status;
    return dto;
  }
}
