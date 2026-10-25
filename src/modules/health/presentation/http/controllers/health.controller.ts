import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ResponseCode } from 'shared/presentation/decorators/response-code.decorator';
import { ServiceConstants } from 'config/service.constants';
import { Public } from 'shared/presentation/decorators/auth/access-control.decorators';

@ApiTags('Health')
@Public()
@Controller(`${ServiceConstants.PATH}/health`)
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
