// api/archetype.js
// Vercel serverless function — Phase C of stablecoin-risk-explorer
// GET /api/archetype?start=YYYY-MM-DD&end=YYYY-MM-DD&token=USDC

const QUERY_ID = '6796353';
const DUNE_BASE = 'https://api.dune.com/api/v1';
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

// Module-level cache: key → { payload, expires_at }
const cache = new Map();

function cacheKey(start, end, token) {
  return `${start}|${end}|${token}`;
}

async function dunePost(path, body, apiKey) {
  const res = await fetch(`${DUNE_BASE}${path}`, {
    method: 'POST',
    headers: {
      'X-Dune-API-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Dune POST ${path} responded ${res.status}`);
  }
  return res.json();
}

async function duneGet(path, apiKey) {
  const res = await fetch(`${DUNE_BASE}${path}`, {
    headers: { 'X-Dune-API-Key': apiKey },
  });
  if (!res.ok) {
    throw new Error(`Dune GET ${path} responded ${res.status}`);
  }
  return res.json();
}

async function waitForResult(executionId, apiKey, maxWaitMs = 90000) {
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    const status = await duneGet(`/execution/${executionId}/status`, apiKey);
    console.log('[dune] poll state:', status.state);
    if (status.state === 'QUERY_STATE_COMPLETED') {
      return duneGet(`/execution/${executionId}/results`, apiKey);
    }
    if (
      status.state === 'QUERY_STATE_FAILED' ||
      status.state === 'QUERY_STATE_CANCELLED'
    ) {
      throw new Error(`Dune execution ended with state: ${status.state}`);
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error('Dune execution timed out');
}

function normalise(rows) {
  return rows.map((row) => ({
    date:        row.day ?? row.date ?? row.dt,
    archetype:   row.archetype,
    volume_usd:  Number(row.volume_usd         ?? row.total_volume_usd      ?? 0),
    tx_count:    Number(row.tx_count            ?? row.transfer_count        ?? 0),
    median_size: Number(row.median_size         ?? row.median_transfer_usd   ?? 0),
    pct90_size:  Number(row.pct90_size          ?? row.p90_transfer_usd      ?? 0),
  }));
}

export default async function handler(req, res) {
  const { start, end, token = 'USDC' } = req.query;

  if (!start || !end) {
    return res
      .status(400)
      .json({ error: 'start and end query params are required (YYYY-MM-DD)', code: 'MISSING_PARAMS' });
  }

  if (end < start) {
    return res
      .status(400)
      .json({ error: 'end date must not be before start date', code: 'INVALID_DATE_RANGE' });
  }

  const apiKey = process.env.DUNE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Internal configuration error', code: 'CONFIG_ERROR' });
  }

  const key = cacheKey(start, end, token);
  const cached = cache.get(key);
  if (cached && cached.expires_at > Date.now()) {
    return res.status(200).json(cached.payload);
  }

  try {
    const executeResponse = await dunePost(
      `/query/${QUERY_ID}/execute`,
      {},
      apiKey,
    );
    console.log('[dune] execute response:', JSON.stringify(executeResponse));
    const { execution_id } = executeResponse;

    const result = await waitForResult(execution_id, apiKey);
    const rows = result?.result?.rows ?? [];
    const fetched_at = new Date().toISOString();

    const payload = {
      dune_query_id: QUERY_ID,
      fetched_at,
      data: normalise(rows),
    };

    cache.set(key, { payload, expires_at: Date.now() + CACHE_TTL_MS });
    return res.status(200).json(payload);
  } catch (err) {
    console.error('[dune] error:', err.message);
    return res.status(502).json({ error: 'Dune API error', code: 'DUNE_ERROR' });
  }
}
