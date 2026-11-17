import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('check() returns status "ok" and a whole-number uptime', () => {
    const result = controller.check();

    expect(result.status).toBe('ok');
    expect(Number.isInteger(result.uptimeSeconds)).toBe(true);
    expect(result.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });
});
