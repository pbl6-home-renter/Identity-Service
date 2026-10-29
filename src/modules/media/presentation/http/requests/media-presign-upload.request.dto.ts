import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { MediaPresignUploadInput } from '../../../application/commands/media-presign-upload/media-presign-upload.command';
import { MediaCaptureSource } from '../../../domain/enums/media-capture-source.enum';
import { MediaContentType } from '../../../domain/enums/media-content-type.enum';
import { MediaOwnerType } from '../../../domain/enums/media-owner-type.enum';
import { MediaPurpose } from '../../../domain/enums/media-purpose.enum';

/**
 * Only the shape is validated here. Whether the MIME type, size and purpose
 * fit the owner is a business rule checked by the `Media` aggregate, so the
 * client gets `MEDIA_TYPE_NOT_ALLOWED` / `INVALID_PURPOSE` instead of `VALIDATION_FAILED`.
 */
export class MediaPresignUploadRequestDto implements MediaPresignUploadInput {
  @ApiProperty({ enum: MediaOwnerType, example: MediaOwnerType.ROOM })
  @IsEnum(MediaOwnerType)
  ownerType: MediaOwnerType;

  @ApiProperty({
    format: 'uuid',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  @IsUUID()
  ownerId: Uuid;

  @ApiProperty({ enum: MediaPurpose, example: MediaPurpose.COVER_PHOTO })
  @IsEnum(MediaPurpose)
  purpose: MediaPurpose;

  @ApiProperty({ example: 'p201.jpg', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fileName: string;

  @ApiProperty({ enum: MediaContentType, example: MediaContentType.JPEG })
  @IsString()
  @IsNotEmpty()
  contentType: string;

  @ApiPropertyOptional({
    enum: MediaCaptureSource,
    nullable: true,
    description:
      'Required as `camera_direct` when a tenant uploads `meter_reading_evidence`.',
  })
  @IsOptional()
  @IsEnum(MediaCaptureSource)
  captureSource?: MediaCaptureSource | null;

  @ApiProperty({ description: 'File size in bytes', example: 248120 })
  @IsInt()
  @IsPositive()
  size: number;
}
