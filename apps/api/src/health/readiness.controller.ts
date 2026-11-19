import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  MongooseHealthIndicator,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service.js';

@ApiTags('health')
@Controller('readyz')
export class ReadinessController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaIndicator: PrismaHealthIndicator,
    private readonly mongooseIndicator: MongooseHealthIndicator,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Ready to take traffic: both databases answer a ping.
   */
  @Get()
  @HealthCheck()
  @ApiOkResponse({ description: 'Postgres and MongoDB are reachable' })
  @ApiServiceUnavailableResponse({
    description: 'At least one database is down',
  })
  check() {
    return this.health.check([
      () => this.prismaIndicator.pingCheck('postgres', this.prisma),
      () => this.mongooseIndicator.pingCheck('mongodb'),
    ]);
  }
}
