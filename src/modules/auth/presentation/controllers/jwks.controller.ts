import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { createPublicKey } from 'node:crypto';
import { ApiConfigService } from 'shared/services/api-config.service';
import { JwkResponseDto } from '../response/jwk.response.dto';
import { JwksResponseDto } from '../response/jwks.response.dto';

@ApiTags('Discovery')
@Controller('.well-known')
export class JwksController {
  constructor(private readonly configService: ApiConfigService) {}

  @Get('jwks.json')
  @ApiOperation({
    summary: 'Get public keys for JWT signature verification',
    description:
      'Returns public RSA keys. The API Gateway and backend services use this endpoint to verify tokens issued by Identity-Service.',
  })
  @ApiResponse({
    status: 200,
    type: JwksResponseDto,
    description: 'Public RSA keys used to verify Identity-Service JWTs.',
  })
  getJwks(): JwksResponseDto {
    const publicJwk = createPublicKey(this.configService.jwt.publicKey).export({
      format: 'jwk',
    }) as Pick<JwkResponseDto, 'kty' | 'n' | 'e'>;

    return JwksResponseDto.create([
      JwkResponseDto.create(
        publicJwk.kty,
        publicJwk.n,
        publicJwk.e,
        'sig',
        'RS256',
        this.configService.jwt.keyId,
      ),
    ]);
  }
}
