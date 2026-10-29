import { ApiProperty } from '@nestjs/swagger';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { MediaUploadTicketResult } from '../../../application/results/media-upload-ticket.result';
import { MediaContentType } from '../../../domain/enums/media-content-type.enum';
import { MediaOwnerType } from '../../../domain/enums/media-owner-type.enum';
import { MediaPurpose } from '../../../domain/enums/media-purpose.enum';

export class MediaUploadRequiredHeadersDto {
  @ApiProperty({
    name: 'Content-Type',
    enum: MediaContentType,
    example: MediaContentType.JPEG,
  })
  'Content-Type': MediaContentType;
}

export class MediaPresignUploadResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: Uuid;

  @ApiProperty({ enum: MediaOwnerType })
  ownerType: MediaOwnerType;

  @ApiProperty({ format: 'uuid' })
  ownerId: Uuid;

  @ApiProperty({ enum: MediaPurpose })
  purpose: MediaPurpose;

  @ApiProperty({ description: 'Signed URL to PUT the file to' })
  uploadUrl: string;

  @ApiProperty({ type: MediaUploadRequiredHeadersDto })
  requiredHeaders: MediaUploadRequiredHeadersDto;

  @ApiProperty({ example: 900 })
  expiresIn: number;

  static fromResult({
    media,
    uploadUrl,
    expiresIn,
  }: MediaUploadTicketResult): MediaPresignUploadResponseDto {
    const dto = new MediaPresignUploadResponseDto();
    dto.id = media.id;
    dto.ownerType = media.ownerType;
    dto.ownerId = media.ownerId;
    dto.purpose = media.purpose;
    dto.uploadUrl = uploadUrl;
    dto.requiredHeaders = { 'Content-Type': media.contentType };
    dto.expiresIn = expiresIn;
    return dto;
  }
}
