import { ApiProperty } from '@nestjs/swagger';

export class MediaDownloadUrlResponseDto {
  @ApiProperty({ description: 'Short-lived signed R2 GET URL' })
  url: string;

  @ApiProperty()
  fileName: string;

  @ApiProperty()
  contentType: string;

  static fromResult(result: MediaDownloadUrlResponseDto): MediaDownloadUrlResponseDto {
    const dto = new MediaDownloadUrlResponseDto();
    dto.url = result.url;
    dto.fileName = result.fileName;
    dto.contentType = result.contentType;
    return dto;
  }
}
