import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module.js';
import { WalletModule } from './wallet/wallet.module.js';
import { ActivityModule } from './activity/activity.module.js';

@Module({
  imports: [HealthModule, WalletModule, ActivityModule],
})
export class AppModule {}
