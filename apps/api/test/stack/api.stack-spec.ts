import { randomUUID } from 'node:crypto';
import request from 'supertest';

const BASE_URL = process.env.STACK_URL ?? 'http://localhost:3000';
const api = () => request(BASE_URL);

async function createMember(): Promise<string> {
  const res = await api()
    .post('/api/members')
    .send({ email: `${randomUUID()}@example.com`, displayName: 'Stack test' })
    .expect(201);
  return (res.body as { id: string }).id;
}

const earn = (memberId: string, points: number, key?: string) => {
  const req = api().post('/api/wallet/earn');
  if (key) req.set('Idempotency-Key', key);
  return req.send({ memberId, points, reason: 'stack test' });
};

const balance = async (memberId: string): Promise<number> => {
  const res = await api().get(`/api/wallet/${memberId}`).expect(200);
  return (res.body as { balance: number }).balance;
};

describe(`API container stack (${BASE_URL})`, () => {
  beforeAll(async () => {
    // Fail fast with a clear message instead of 10 connection errors.
    const res = await api()
      .get('/readyz')
      .catch(() => null);
    if (res?.status !== 200) {
      throw new Error(
        `Stack is not ready at ${BASE_URL}. Run \`npm run stack:up\` first.`,
      );
    }
  });

  it('GET /healthz and /readyz -> 200, both databases up', async () => {
    await api().get('/healthz').expect(200);
    const res = await api().get('/readyz').expect(200);
    expect(res.body).toMatchObject({
      status: 'ok',
      details: { postgres: { status: 'up' }, mongodb: { status: 'up' } },
    });
  });

  it('serves the OpenAPI contract', async () => {
    const res = await api().get('/docs/openapi.json').expect(200);
    expect(Object.keys((res.body as { paths: object }).paths)).toContain(
      '/api/members',
    );
  });

  it('migrations ran: a new member gets a wallet with balance 0', async () => {
    const memberId = await createMember();
    expect(await balance(memberId)).toBe(0);
  });

  it('earn and redeem go through the Postgres ledger', async () => {
    const memberId = await createMember();
    await earn(memberId, 100).expect(201);
    await api()
      .post('/api/wallet/redeem')
      .send({ memberId, points: 30, rewardId: randomUUID() })
      .expect(201);
    expect(await balance(memberId)).toBe(70);
  });

  it('rejects an overdraft with 409 and leaves the balance unchanged', async () => {
    const memberId = await createMember();
    await earn(memberId, 10).expect(201);
    await api()
      .post('/api/wallet/redeem')
      .send({ memberId, points: 11, rewardId: randomUUID() })
      .expect(409);
    expect(await balance(memberId)).toBe(10);
  });

  it('applies a retried Idempotency-Key once', async () => {
    const memberId = await createMember();
    const key = randomUUID();
    const first = await earn(memberId, 25, key).expect(201);
    const retry = await earn(memberId, 25, key).expect(201);
    expect((retry.body as { entryId: string }).entryId).toBe(
      (first.body as { entryId: string }).entryId,
    );
    expect(await balance(memberId)).toBe(25);
  });

  it('stores a purchase event in Mongo and pays the bonus once on retry', async () => {
    const memberId = await createMember();
    const purchase = {
      memberId,
      orderId: randomUUID(),
      amountMinor: 1299,
      currency: 'EUR',
    };
    await api().post('/api/activity/purchase').send(purchase).expect(202);
    await api().post('/api/activity/purchase').send(purchase).expect(202);
    expect(await balance(memberId)).toBe(12);
  });

  it('accepts a check-in event', async () => {
    const memberId = await createMember();
    const res = await api()
      .post('/api/activity/check-in')
      .send({ memberId, locationId: 'store-1' })
      .expect(202);
    expect(res.body).toHaveProperty('eventId');
  });
});
