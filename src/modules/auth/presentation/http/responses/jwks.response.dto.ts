import { ApiProperty } from '@nestjs/swagger';
import { JwkResponseDto } from './jwk.response.dto';

export class JwksResponseDto {
  @ApiProperty({
    type: () => [JwkResponseDto],
    description: 'Public RSA keys available for JWT signature verification.',
  })
  keys: JwkResponseDto[];

  static create(keys: JwkResponseDto[]): JwksResponseDto {
    const dto = new JwksResponseDto();
    dto.keys = keys;
    return dto;
  }
}
