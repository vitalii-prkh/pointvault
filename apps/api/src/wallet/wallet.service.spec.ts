import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { WalletService } from './wallet.service.js';

// The happy paths run against a real database in the e2e tests. These cover the error mapping.
describe('WalletService', () => {
  let service: WalletService;
  const memberId = '3f2b8a5e-6c1d-4e7a-9b0f-1a2b3c4d5e6f';
  const prisma = {
    $transaction: vi.fn(),
    wallet: { findUnique: vi.fn() },
    ledgerTransaction: { findUnique: vi.fn() },
  };

  const prismaError = (code: string) =>
    new Prisma.PrismaClientKnownRequestError('db error', {
      code,
      clientVersion: 'test',
    });

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [WalletService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(WalletService);
  });

  it('redeem() maps a failed balance guard (P2025) to 409 Insufficient balance', async () => {
    prisma.$transaction.mockRejectedValue(prismaError('P2025'));

    await expect(
      service.redeem({ memberId, points: 10, rewardId: 'coffee' }),
    ).rejects.toThrow(new ConflictException('Insufficient balance'));
  });

  it('earn() rejects an Idempotency-Key that was used for a different request', async () => {
    prisma.ledgerTransaction.findUnique.mockResolvedValue({
      type: 'EARN',
      entries: [{ amount: 999, wallet: { memberId } }],
    });

    await expect(
      service.earn({ memberId, points: 100, reason: 'Bonus' }, 'key-1'),
    ).rejects.toThrow(ConflictException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('earn() returns the original entry for a repeated Idempotency-Key', async () => {
    const createdAt = new Date('2026-11-18T10:00:00.000Z');
    prisma.ledgerTransaction.findUnique.mockResolvedValue({
      type: 'EARN',
      entries: [
        {
          id: 'entry-1',
          amount: 100,
          balanceAfter: 100,
          createdAt,
          wallet: { memberId },
        },
      ],
    });

    await expect(
      service.earn({ memberId, points: 100, reason: 'Bonus' }, 'key-1'),
    ).resolves.toEqual({
      entryId: 'entry-1',
      memberId,
      type: 'EARN',
      points: 100,
      balanceAfter: 100,
      createdAt: createdAt.toISOString(),
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('getBalance() throws 404 when the member has no wallet', async () => {
    prisma.wallet.findUnique.mockResolvedValue(null);

    await expect(service.getBalance(memberId)).rejects.toThrow(
      NotFoundException,
    );
  });
});
