import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from '../wallet/wallet.service.js';
import { ActivityService, purchaseBonus } from './activity.service.js';
import { ActivityEvent } from './schemas/activity-event.schema.js';

describe('purchaseBonus', () => {
  it.each([
    [1299, 12],
    [100, 1],
    [99, 0],
  ])('%i minor units earns %i points', (amountMinor, points) => {
    expect(purchaseBonus(amountMinor)).toBe(points);
  });
});

describe('ActivityService', () => {
  let service: ActivityService;
  const memberId = '3f2b8a5e-6c1d-4e7a-9b0f-1a2b3c4d5e6f';
  const receivedAt = new Date('2026-11-18T10:00:00.000Z');
  const events = { create: vi.fn() };
  const wallet = { earn: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    events.create.mockImplementation((doc: { eventId: string }) =>
      Promise.resolve({ ...doc, receivedAt }),
    );
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityService,
        { provide: getModelToken(ActivityEvent.name), useValue: events },
        { provide: WalletService, useValue: wallet },
      ],
    }).compile();

    service = module.get(ActivityService);
  });

  it('purchase() awards the bonus with the order id as idempotency key, then logs the event', async () => {
    const result = await service.purchase({
      memberId,
      orderId: 'ord-1',
      amountMinor: 1299,
      currency: 'EUR',
    });

    expect(wallet.earn).toHaveBeenCalledWith(
      { memberId, points: 12, reason: 'Purchase ord-1' },
      'purchase:ord-1',
    );
    expect(events.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'purchase', memberId, bonusPoints: 12 }),
    );
    expect(result.acceptedAt).toBe(receivedAt.toISOString());
  });

  it('purchase() under 1 currency unit logs the event without awarding points', async () => {
    await service.purchase({
      memberId,
      orderId: 'ord-2',
      amountMinor: 50,
      currency: 'EUR',
    });

    expect(wallet.earn).not.toHaveBeenCalled();
    expect(events.create).toHaveBeenCalledOnce();
  });

  it('checkIn() logs a check-in event', async () => {
    await service.checkIn({ memberId });

    expect(events.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'check-in', memberId }),
    );
  });
});
