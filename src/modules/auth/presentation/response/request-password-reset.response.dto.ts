import { ApiProperty } from '@nestjs/swagger';

export class RequestPasswordResetResponseDto {
  @ApiProperty({
    type: Boolean,
    enum: [true],
    example: true,
    description: 'The system accepted the request for processing',
  })
  accepted: true;

  static create(): RequestPasswordResetResponseDto {
    const dto = new RequestPasswordResetResponseDto();
    dto.accepted = true;
    return dto;
  }
}
