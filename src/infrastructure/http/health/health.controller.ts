import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  HealthIndicatorResult,
  MongooseHealthIndicator,
} from '@nestjs/terminus';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly mongoose: MongooseHealthIndicator,
    private readonly amqp: AmqpConnection,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({ status: 200 })
  check() {
    return this.health.check([
      () => this.mongoose.pingCheck('mongo'),
      () => this.rabbitmqCheck(),
    ]);
  }

  private rabbitmqCheck(): HealthIndicatorResult {
    const isConnected = this.amqp.connected;
    return {
      rabbitmq: {
        status: isConnected ? 'up' : 'down',
      },
    };
  }
}
