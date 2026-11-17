import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';

describe('API (e2e)', () => {
  let app: INestApplication<App>;
  const memberId = '3f2b8a5e-6c1d-4e7a-9b0f-1a2b3c4d5e6f';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(() => app.close());

  it('GET  /healthz -> 200', () =>
    request(app.getHttpServer())
      .get('/healthz')
      .expect(200)
      .expect((res) => expect(res.body.status).toBe('ok')));

  it('POST /api/wallet/earn -> 201', () =>
    request(app.getHttpServer())
      .post('/api/wallet/earn')
      .send({ memberId, points: 100, reason: 'Welcome bonus' })
      .expect(201)
      .expect((res) =>
        expect(res.body).toMatchObject({ memberId, type: 'EARN', points: 100 }),
      ));

  it('POST /api/wallet/earn with negative points -> 400', () =>
    request(app.getHttpServer())
      .post('/api/wallet/earn')
      .send({ memberId, points: -5, reason: 'x' })
      .expect(400));

  it('POST /api/wallet/redeem with unknown field -> 400', () =>
    request(app.getHttpServer())
      .post('/api/wallet/redeem')
      .send({ memberId, points: 10, rewardId: 'coffee', hack: true })
      .expect(400));

  it('POST /api/activity/purchase -> 202', () =>
    request(app.getHttpServer())
      .post('/api/activity/purchase')
      .send({ memberId, orderId: 'ord-1', amountMinor: 1999, currency: 'EUR' })
      .expect(202));
});
