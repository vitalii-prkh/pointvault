import { INestApplication } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import { Connection } from 'mongoose';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('API (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let mongo: Connection;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    mongo = app.get<Connection>(getConnectionToken());
  });

  afterAll(() => app.close());

  const api = () => request(app.getHttpServer());

  /** Each test gets its own member, so tests don't depend on each other's balances. */
  async function createMember(): Promise<string> {
    const res = await api()
      .post('/api/members')
      .send({
        email: `${randomUUID()}@example.com`,
        displayName: 'Test member',
      })
      .expect(201);
    return res.body.id;
  }

  const earn = (memberId: string, points: number, key?: string) => {
    const req = api().post('/api/wallet/earn');
    if (key) req.set('Idempotency-Key', key);
    return req.send({ memberId, points, reason: 'Test' });
  };

  const redeem = (memberId: string, points: number) =>
    api()
      .post('/api/wallet/redeem')
      .send({ memberId, points, rewardId: 'coffee' });

  describe('health', () => {
    it('GET /healthz -> 200', () => api().get('/healthz').expect(200));

    it('GET /readyz -> 200 with both databases up', async () => {
      const res = await api().get('/readyz').expect(200);
      expect(res.body.info).toMatchObject({
        postgres: { status: 'up' },
        mongodb: { status: 'up' },
      });
    });
  });

  describe('members', () => {
    it('POST /api/members creates a member with a zero-balance wallet', async () => {
      const memberId = await createMember();

      const res = await api().get(`/api/wallet/${memberId}`).expect(200);
      expect(res.body).toMatchObject({ memberId, balance: 0 });
    });

    it('POST /api/members with a duplicate email -> 409', async () => {
      const email = `${randomUUID()}@example.com`;
      await api()
        .post('/api/members')
        .send({ email, displayName: 'A' })
        .expect(201);
      await api()
        .post('/api/members')
        .send({ email, displayName: 'B' })
        .expect(409);
    });

    it('GET /api/members/:id for an unknown id -> 404', () =>
      api().get(`/api/members/${randomUUID()}`).expect(404));
  });

  describe('wallet', () => {
    it('earn then redeem updates the balance', async () => {
      const memberId = await createMember();

      const earned = await earn(memberId, 100).expect(201);
      expect(earned.body).toMatchObject({
        memberId,
        type: 'EARN',
        points: 100,
        balanceAfter: 100,
      });

      const redeemed = await redeem(memberId, 30).expect(201);
      expect(redeemed.body).toMatchObject({
        type: 'REDEEM',
        points: 30,
        balanceAfter: 70,
      });

      const balance = await api().get(`/api/wallet/${memberId}`).expect(200);
      expect(balance.body.balance).toBe(70);
    });

    it('redeem more than the balance -> 409 and the balance is unchanged', async () => {
      const memberId = await createMember();
      await earn(memberId, 10).expect(201);

      await redeem(memberId, 11).expect(409);

      const balance = await api().get(`/api/wallet/${memberId}`).expect(200);
      expect(balance.body.balance).toBe(10);
    });

    it('concurrent redeems never overdraw the wallet', async () => {
      const memberId = await createMember();
      await earn(memberId, 100).expect(201);

      // 10 parallel redeems of 30: at most 3 can succeed.
      const results = await Promise.all(
        Array.from({ length: 10 }, () => redeem(memberId, 30)),
      );
      const statuses = results.map((r) => r.status);

      expect(statuses.filter((s) => s === 201)).toHaveLength(3);
      expect(statuses.filter((s) => s === 409)).toHaveLength(7);
      const balance = await api().get(`/api/wallet/${memberId}`).expect(200);
      expect(balance.body.balance).toBe(10);
    });

    it('every transaction balances: member and system entries sum to zero', async () => {
      const memberId = await createMember();
      const res = await earn(memberId, 25).expect(201);

      const entry = await prisma.ledgerEntry.findUniqueOrThrow({
        where: { id: res.body.entryId },
      });
      const sum = await prisma.ledgerEntry.aggregate({
        where: { transactionId: entry.transactionId },
        _sum: { amount: true },
        _count: true,
      });
      expect(sum).toMatchObject({ _sum: { amount: 0 }, _count: 2 });
    });

    it('the same Idempotency-Key is applied once', async () => {
      const memberId = await createMember();
      const key = randomUUID();

      const first = await earn(memberId, 50, key).expect(201);
      const retry = await earn(memberId, 50, key).expect(201);

      expect(retry.body.entryId).toBe(first.body.entryId);
      const balance = await api().get(`/api/wallet/${memberId}`).expect(200);
      expect(balance.body.balance).toBe(50);
    });

    it('an Idempotency-Key reused for a different request -> 409', async () => {
      const memberId = await createMember();
      const key = randomUUID();

      await earn(memberId, 50, key).expect(201);
      await earn(memberId, 60, key).expect(409);
    });

    it('earn for an unknown member -> 404', () =>
      earn(randomUUID(), 10).expect(404));

    it('earn with negative points -> 400', async () =>
      earn(await createMember(), -5).expect(400));
  });

  describe('activity', () => {
    it('POST /api/activity/check-in stores an event in MongoDB', async () => {
      const memberId = await createMember();

      const res = await api()
        .post('/api/activity/check-in')
        .send({ memberId, locationId: 'store-42' })
        .expect(202);

      const event = await mongo
        .collection('activity_events')
        .findOne({ eventId: res.body.eventId });
      expect(event).toMatchObject({
        type: 'check-in',
        memberId,
        payload: { locationId: 'store-42' },
      });
    });

    it('POST /api/activity/purchase awards the bonus once, even when retried', async () => {
      const memberId = await createMember();
      const purchase = {
        memberId,
        orderId: `ord-${randomUUID()}`,
        amountMinor: 1299,
        currency: 'EUR',
      };

      await api().post('/api/activity/purchase').send(purchase).expect(202);
      await api().post('/api/activity/purchase').send(purchase).expect(202);

      const balance = await api().get(`/api/wallet/${memberId}`).expect(200);
      expect(balance.body.balance).toBe(12);
      expect(
        await mongo
          .collection('activity_events')
          .countDocuments({ memberId, type: 'purchase' }),
      ).toBe(2);
    });
  });
});
