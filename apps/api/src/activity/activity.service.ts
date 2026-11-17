import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ActivityAcceptedResponseDto } from './dto/activity-accepted-response.dto.js';

// Phase 1: accept and drop. Phase 2 writes an ActivityEvent to MongoDB
// (and may award a bonus via WalletService).
@Injectable()
export class ActivityService {
  record(
    _type: 'check-in' | 'purchase',
    _payload: unknown,
  ): ActivityAcceptedResponseDto {
    return {
      eventId: randomUUID(),
      acceptedAt: new Date().toISOString(),
    };
  }
}
