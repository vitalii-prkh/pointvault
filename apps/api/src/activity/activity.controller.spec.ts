import { Test, TestingModule } from '@nestjs/testing';
import { ActivityController } from './activity.controller.js';
import { ActivityService } from './activity.service.js';

describe('ActivityController', () => {
  let controller: ActivityController;
  let service: ActivityService;
  const memberId = '3f2b8a5e-6c1d-4e7a-9b0f-1a2b3c4d5e6f';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivityController],
      providers: [ActivityService],
    }).compile();

    controller = module.get<ActivityController>(ActivityController);
    service = module.get<ActivityService>(ActivityService);
  });

  it('checkIn() records a "check-in" event', () => {
    const dto = { memberId, locationId: 'store-42' };
    const spy = vi.spyOn(service, 'record');

    controller.checkIn(dto);

    expect(spy).toHaveBeenCalledWith('check-in', dto);
  });

  it('purchase() records a "purchase" event', () => {
    const dto = {
      memberId,
      orderId: 'ord-1',
      amountMinor: 1999,
      currency: 'EUR',
    };
    const spy = vi.spyOn(service, 'record');

    controller.purchase(dto);

    expect(spy).toHaveBeenCalledWith('purchase', dto);
  });
});
