import { Test, TestingModule } from '@nestjs/testing';
import { ActivityController } from './activity.controller.js';
import { ActivityService } from './activity.service.js';

describe('ActivityController', () => {
  let controller: ActivityController;
  const activity = { checkIn: vi.fn(), purchase: vi.fn() };
  const memberId = '3f2b8a5e-6c1d-4e7a-9b0f-1a2b3c4d5e6f';

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivityController],
      providers: [{ provide: ActivityService, useValue: activity }],
    }).compile();

    controller = module.get(ActivityController);
  });

  it('checkIn() passes the DTO to the service', async () => {
    const dto = { memberId, locationId: 'store-42' };

    await controller.checkIn(dto);

    expect(activity.checkIn).toHaveBeenCalledWith(dto);
  });

  it('purchase() passes the DTO to the service', async () => {
    const dto = {
      memberId,
      orderId: 'ord-1',
      amountMinor: 1999,
      currency: 'EUR',
    };

    await controller.purchase(dto);

    expect(activity.purchase).toHaveBeenCalledWith(dto);
  });
});
