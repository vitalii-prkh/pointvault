import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller.js';
import { ReadinessController } from './readiness.controller.js';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController, ReadinessController],
})
export class HealthModule {}
