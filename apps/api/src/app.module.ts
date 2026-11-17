import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module.js';
import { WalletModule } from './wallet/wallet.module.js';

@Module({
  imports: [HealthModule, WalletModule],
})
export class AppModule {}
