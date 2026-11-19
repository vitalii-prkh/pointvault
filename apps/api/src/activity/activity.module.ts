import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WalletModule } from '../wallet/wallet.module.js';
import { ActivityController } from './activity.controller.js';
import { ActivityService } from './activity.service.js';
import {
  ActivityEvent,
  ActivityEventSchema,
} from './schemas/activity-event.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: ActivityEvent.name,
        schema: ActivityEventSchema,
      },
    ]),
    WalletModule,
  ],
  controllers: [ActivityController],
  providers: [ActivityService],
})
export class ActivityModule {}
