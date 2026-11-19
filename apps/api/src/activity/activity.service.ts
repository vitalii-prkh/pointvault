import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomUUID } from 'node:crypto';
import { WalletService } from '../wallet/wallet.service.js';
import { ActivityAcceptedResponseDto } from './dto/activity-accepted-response.dto.js';
import { CheckInDto } from './dto/check-in.dto.js';
import { PurchaseDto } from './dto/purchase.dto.js';
import {
  ActivityEvent,
  ActivityEventType,
} from './schemas/activity-event.schema.js';

/**
 * 1 point per whole currency unit spent, e.g. 12.99 EUR (1299 minor units) earns 12 points.
 */
export function purchaseBonus(amountMinor: number): number {
  return Math.floor(amountMinor / 100);
}

@Injectable()
export class ActivityService {
  constructor(
    @InjectModel(ActivityEvent.name)
    private readonly events: Model<ActivityEvent>,
    private readonly wallet: WalletService,
  ) {}

  checkIn(dto: CheckInDto): Promise<ActivityAcceptedResponseDto> {
    return this.record('check-in', dto.memberId, {
      locationId: dto.locationId,
    });
  }

  /**
   * Awards the purchase bonus in Postgres first, then logs the event in Mongo. The order id is the
   * idempotency key, so a retried purchase never pays the bonus twice.
   */
  async purchase(dto: PurchaseDto): Promise<ActivityAcceptedResponseDto> {
    const bonusPoints = purchaseBonus(dto.amountMinor);

    if (bonusPoints > 0) {
      await this.wallet.earn(
        {
          memberId: dto.memberId,
          points: bonusPoints,
          reason: `Purchase ${dto.orderId}`,
        },
        `purchase:${dto.orderId}`,
      );
    }

    const { orderId, amountMinor, currency } = dto;

    return this.record(
      'purchase',
      dto.memberId,
      { orderId, amountMinor, currency },
      bonusPoints,
    );
  }

  private async record(
    type: ActivityEventType,
    memberId: string,
    payload: Record<string, unknown>,
    bonusPoints?: number,
  ): Promise<ActivityAcceptedResponseDto> {
    const event = await this.events.create({
      eventId: randomUUID(),
      type,
      memberId,
      payload,
      bonusPoints,
    });

    return {
      eventId: event.eventId,
      acceptedAt: event.receivedAt.toISOString(),
    };
  }
}
