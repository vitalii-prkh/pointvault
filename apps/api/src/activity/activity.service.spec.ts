import { Test, TestingModule } from '@nestjs/testing';
import { ActivityService } from './activity.service.js';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe('ActivityService', () => {
  let service: ActivityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ActivityService],
    }).compile();

    service = module.get<ActivityService>(ActivityService);
  });

  it('record() returns a new eventId and an ISO acceptedAt', () => {
    const result = service.record('check-in', {});

    expect(result.eventId).toMatch(UUID_RE);
    expect(new Date(result.acceptedAt).toISOString()).toBe(result.acceptedAt);
  });

  it('record() returns a different eventId each call', () => {
    expect(service.record('purchase', {}).eventId).not.toBe(
      service.record('purchase', {}).eventId,
    );
  });
});
