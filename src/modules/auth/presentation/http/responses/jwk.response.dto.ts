import { ApiProperty } from '@nestjs/swagger';

export class JwkResponseDto {
  @ApiProperty({ example: 'RSA', description: 'Key type.' })
  kty: string;

  @ApiProperty({
    example: 'base64url-encoded-modulus',
    description: 'RSA modulus encoded as Base64URL.',
  })
  n: string;

  @ApiProperty({
    example: 'AQAB',
    description: 'RSA public exponent encoded as Base64URL.',
  })
  e: string;

  @ApiProperty({ example: 'sig', description: 'Intended use of the key.' })
  use: string;

  @ApiProperty({
    example: 'RS256',
    description: 'Algorithm used to verify JWT signatures.',
  })
  alg: string;

  @ApiProperty({
    example: 'rentify-identity-2026-01',
    description: 'Key identifier matching the JWT header kid claim.',
  })
  kid: string;

  static create(
    kty: string,
    n: string,
    e: string,
    use: string,
    alg: string,
    kid: string,
  ): JwkResponseDto {
    const dto = new JwkResponseDto();
    dto.kty = kty;
    dto.n = n;
    dto.e = e;
    dto.use = use;
    dto.alg = alg;
    dto.kid = kid;
    return dto;
  }
}
