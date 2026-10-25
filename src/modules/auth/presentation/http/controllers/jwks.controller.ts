import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { createPublicKey } from 'node:crypto';
import { JwtConfigService } from '../../../infrastructure/config/jwt-config.service';
import { Public } from 'shared/presentation/decorators/auth/access-control.decorators';
import { JwkResponseDto } from '../responses/jwk.response.dto';
import { JwksResponseDto } from '../responses/jwks.response.dto';

@ApiTags('Discovery')
@Public()
@Controller('.well-known')
export class JwksController {
  constructor(private readonly jwtConfig: JwtConfigService) {}

  @Get('jwks.json')
  @ApiOperation({
    summary: 'Get public keys for JWT signature verification',
    description:
      'Returns public RSA keys as a bare RFC 7517 JWK Set (no response envelope). The API Gateway and backend services use this endpoint to verify tokens issued by Identity-Service.',
  })
  @ApiResponse({
    status: 200,
    type: JwksResponseDto,
    description: 'Public RSA keys used to verify Identity-Service JWTs.',
  })
  getJwks(@Res() res: Response): void {
    const publicJwk = createPublicKey(this.jwtConfig.publicKey).export({
      format: 'jwk',
    }) as Pick<JwkResponseDto, 'kty' | 'n' | 'e'>;

    const jwks = JwksResponseDto.create([
      JwkResponseDto.create(
        publicJwk.kty,
        publicJwk.n,
        publicJwk.e,
        'sig',
        'RS256',
        this.jwtConfig.keyId,
      ),
    ]);
    res.json(jwks);
  }
}
