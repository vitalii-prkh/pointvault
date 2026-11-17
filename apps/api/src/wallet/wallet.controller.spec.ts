import { Test, TestingModule } from '@nestjs/testing';
import { WalletController } from './wallet.controller.js';
import { WalletService } from './wallet.service.js';

describe('WalletController', () => {
  let controller: WalletController;
  let service: WalletService;
  const memberId = '3f2b8a5e-6c1d-4e7a-9b0f-1a2b3c4d5e6f';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WalletController],
      providers: [WalletService],
    }).compile();

    controller = module.get<WalletController>(WalletController);
    service = module.get<WalletService>(WalletService);
  });

  it('earn() passes the DTO to WalletService.earn', () => {
    const dto = { memberId, points: 100, reason: 'Welcome bonus' };
    const spy = vi.spyOn(service, 'earn');

    const result = controller.earn(dto);

    expect(spy).toHaveBeenCalledWith(dto);
    expect(result).toBe(spy.mock.results[0].value);
  });

  it('getBalance() passes memberId to WalletService.getBalance', () => {
    const spy = vi.spyOn(service, 'getBalance');

    controller.getBalance(memberId);

    expect(spy).toHaveBeenCalledWith(memberId);
  });
});
