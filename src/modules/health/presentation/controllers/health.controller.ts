import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ResponseCode } from 'shared/decorators/response-code.decorator';
import { Public } from 'shared/decorators/auth.decorators';

@ApiTags('Health')
@Public()
@Controller('identity/health')
export class HealthController {
  @Get()
  @HttpCode(HttpStatus.OK)
  @ResponseCode('HEALTH_OK')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
  })
  check(): { status: string } {
    return {
      status: 'ok',
    };
  }
}
