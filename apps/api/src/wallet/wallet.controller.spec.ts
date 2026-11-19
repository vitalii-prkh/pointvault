import { Test, TestingModule } from '@nestjs/testing';
import { WalletController } from './wallet.controller.js';
import { WalletService } from './wallet.service.js';

describe('WalletController', () => {
  let controller: WalletController;
  const wallet = { earn: vi.fn(), redeem: vi.fn(), getBalance: vi.fn() };
  const memberId = '3f2b8a5e-6c1d-4e7a-9b0f-1a2b3c4d5e6f';

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WalletController],
      providers: [{ provide: WalletService, useValue: wallet }],
    }).compile();

    controller = module.get(WalletController);
  });

  it('earn() passes the DTO and Idempotency-Key to the service', async () => {
    const dto = { memberId, points: 100, reason: 'Welcome bonus' };
    wallet.earn.mockResolvedValue({ entryId: 'e1' });

    await expect(controller.earn(dto, 'key-1')).resolves.toEqual({
      entryId: 'e1',
    });
    expect(wallet.earn).toHaveBeenCalledWith(dto, 'key-1');
  });

  it('redeem() passes the DTO and Idempotency-Key to the service', async () => {
    const dto = { memberId, points: 10, rewardId: 'coffee' };

    await controller.redeem(dto, undefined);

    expect(wallet.redeem).toHaveBeenCalledWith(dto, undefined);
  });

  it('getBalance() passes memberId to the service', async () => {
    await controller.getBalance(memberId);

    expect(wallet.getBalance).toHaveBeenCalledWith(memberId);
  });
});
