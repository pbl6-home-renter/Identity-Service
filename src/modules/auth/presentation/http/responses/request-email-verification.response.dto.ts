import { ApiProperty } from '@nestjs/swagger';

export class RequestEmailVerificationResponseDto {
  @ApiProperty({
    type: Boolean,
    enum: [true],
    example: true,
    description: 'The system accepted the request for processing',
  })
  accepted: true;

  static create(accepted: true): RequestEmailVerificationResponseDto {
    const dto = new RequestEmailVerificationResponseDto();
    dto.accepted = accepted;
    return dto;
  }
}
