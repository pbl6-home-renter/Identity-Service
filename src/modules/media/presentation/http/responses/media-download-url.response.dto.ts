import { ApiProperty } from '@nestjs/swagger';

export class MediaDownloadUrlResponseDto {
  @ApiProperty({ description: 'Short-lived signed R2 GET URL' })
  url: string;

  static fromUrl(url: string): MediaDownloadUrlResponseDto {
    const dto = new MediaDownloadUrlResponseDto();
    dto.url = url;
    return dto;
  }
}
