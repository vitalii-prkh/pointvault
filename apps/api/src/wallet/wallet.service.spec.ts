import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from './wallet.service.js';
import { LedgerEntryType } from './dto/ledger-entry-type.enum.js';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe('WalletService', () => {
  let service: WalletService;
  const memberId = '3f2b8a5e-6c1d-4e7a-9b0f-1a2b3c4d5e6f';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WalletService],
    }).compile();

    service = module.get<WalletService>(WalletService);
  });

  it('earn() returns an EARN entry for the member', () => {
    const entry = service.earn({
      memberId,
      points: 100,
      reason: 'Welcome bonus',
    });

    expect(entry).toMatchObject({
      memberId,
      type: LedgerEntryType.EARN,
      points: 100,
    });
    expect(entry.entryId).toMatch(UUID_RE);
    expect(Number.isNaN(Date.parse(entry.createdAt))).toBe(false);
  });

  it('redeem() returns a REDEEM entry for the member', () => {
    const entry = service.redeem({ memberId, points: 50, rewardId: 'coffee' });

    expect(entry).toMatchObject({
      memberId,
      type: LedgerEntryType.REDEEM,
      points: 50,
    });
  });

  it('getBalance() returns the balance for the member', () => {
    expect(service.getBalance(memberId)).toMatchObject({
      memberId,
      balance: 0,
    });
  });
});
