import { ApiProperty } from '@nestjs/swagger';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { MediaCompletedResult } from '../../../application/results/media-completed.result';
import { MediaFileType } from '../../../domain/enums/media-file-type.enum';
import { MediaOwnerType } from '../../../domain/enums/media-owner-type.enum';
import { MediaPurpose } from '../../../domain/enums/media-purpose.enum';

export class MediaCompleteUploadResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: Uuid;

  @ApiProperty({ enum: MediaOwnerType })
  ownerType: MediaOwnerType;

  @ApiProperty({ format: 'uuid' })
  ownerId: Uuid;

  @ApiProperty({ enum: MediaPurpose })
  purpose: MediaPurpose;

  @ApiProperty({ enum: MediaFileType })
  fileType: MediaFileType;

  @ApiProperty({
    description:
      'Permanent public URL for public files, the API path for private ones',
  })
  url: string;

  static fromResult({
    media,
    url,
  }: MediaCompletedResult): MediaCompleteUploadResponseDto {
    const dto = new MediaCompleteUploadResponseDto();
    dto.id = media.id;
    dto.ownerType = media.ownerType;
    dto.ownerId = media.ownerId;
    dto.purpose = media.purpose;
    dto.fileType = media.fileType;
    dto.url = url;
    return dto;
  }
}
