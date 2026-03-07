// api/__tests__/archetype.test.js
// Run with: npm test

import { jest } from '@jest/globals';

// Set up env and global fetch mock before importing handler
process.env.DUNE_API_KEY = 'test-key';

const mockFetch = jest.fn();
global.fetch = mockFetch;

const { default: handler } = await import('../archetype.js');

function makeReq(query = {}) {
  return { query };
}

function makeRes() {
  const res = {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  return res;
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe('GET /api/archetype', () => {
  test('missing params returns 400', async () => {
    const res = makeRes();
    await handler(makeReq({}), res);
    expect(res.statusCode).toBe(400);
    expect(res.body).toMatchObject({ error: expect.any(String), code: 'MISSING_PARAMS' });
  });

  test('end date before start date returns 400', async () => {
    const res = makeRes();
    await handler(makeReq({ start: '2025-06-01', end: '2025-01-01' }), res);
    expect(res.statusCode).toBe(400);
    expect(res.body).toMatchObject({ error: expect.any(String), code: 'INVALID_DATE_RANGE' });
  });

  test('Dune API error returns 502', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
    const res = makeRes();
    await handler(makeReq({ start: '2024-01-01', end: '2024-06-01' }), res);
    expect(res.statusCode).toBe(502);
    expect(res.body).toMatchObject({ error: expect.any(String), code: 'DUNE_ERROR' });
  });

  test('successful fetch returns correct schema', async () => {
    mockFetch
      // POST /execute
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ execution_id: 'exec-abc' }),
      })
      // GET /status → completed
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ state: 'QUERY_STATE_COMPLETED' }),
      })
      // GET /results
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: {
            rows: [
              {
                day: '2025-03-01',
                archetype: 'exchanges',
                volume_usd: '1000000',
                tx_count: '500',
                median_size: '200',
                pct90_size: '5000',
              },
            ],
          },
        }),
      });

    const res = makeRes();
    await handler(makeReq({ start: '2025-03-01', end: '2025-03-31' }), res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      dune_query_id: expect.any(String),
      fetched_at: expect.any(String),
      data: expect.arrayContaining([
        expect.objectContaining({
          date: '2025-03-01',
          archetype: 'exchanges',
          volume_usd: expect.any(Number),
          tx_count: expect.any(Number),
          median_size: expect.any(Number),
          pct90_size: expect.any(Number),
        }),
      ]),
    });
  });
});
