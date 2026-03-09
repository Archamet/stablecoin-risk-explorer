# Stablecoin Use-Case Risk Explorer

A public compliance-intelligence dashboard that maps on-chain USDC behaviour to KYC design choices.

Rather than monitoring individual wallets or flagging transactions, this tool classifies stablecoin flows into **five ecosystem archetypes** and surfaces population-level, anonymised metrics that a second-line compliance function can use when calibrating due-diligence thresholds, risk appetite statements, and product-specific KYC controls.

**→ Live dashboard: [stablecoin-risk-explorer.vercel.app](https://stablecoin-risk-explorer.vercel.app)**

---

## What It Does

The dashboard answers four KYC design questions using real on-chain data:

| Chart | What it shows | KYC design question |
|---|---|---|
| **Volume by Archetype** | Rolling USDC transfer volume split by ecosystem role (2-year time series) | Which archetypes dominate flow? Where should enhanced due-diligence focus? |
| **Transfer Size Distribution** | Median and 90th-percentile transfer size per archetype | What does "normal" look like per segment? Sets defensible CDD thresholds. |
| **Supply Concentration** | Share of circulating USDC held by each archetype | Counterparty concentration risk; informs risk appetite statements. |
| **Stress Event Overlay** | Volume behaviour during known market stress events | How do archetypes behave under pressure? Scenario input for risk appetite. |

All outputs are **archetype-level aggregates**. No wallet addresses, no transaction hashes, and no individual records are surfaced anywhere in the stack.

---

## The Five Archetypes

| Archetype | Description |
|---|---|
| **Exchanges** | Centralised exchange hot/cold wallets |
| **Custody / Treasury** | Institutional custodians and corporate treasury addresses |
| **Payment Processors** | On-chain payment rails and merchant settlement contracts |
| **DeFi Protocols** | Lending, AMM, and yield protocol smart contracts |
| **Bridges / Wrapped** | Cross-chain bridge contracts and wrapped-token vaults |

Archetype classification is applied via a `CASE` statement in the SQL, keyed on a curated list of labelled contract addresses sourced from Dune's public `labels` table.

---

## Architecture

```
Browser
  │
  │  HTTPS (static assets + JS bundle)
  ▼
Vercel Frontend  (React + Vite, static CDN)
  │
  │  fetch /api/archetype?start=…&end=…&token=USDC
  ▼
Vercel Serverless API  (Node.js · api/archetype.js)
  │  • DUNE_API_KEY held in environment — never exposed to browser
  │  • 15-minute in-memory cache per query key
  ▼
Dune Analytics REST API  (api.dune.com)
  │
  │  public USDC on Ethereum schema
  ▼
Pre-published SQL queries (see query IDs below)
```

---

## Dune Queries

All SQL is saved in the `dune/` directory and published on Dune Analytics:

| Query | ID | Link |
|---|---|---|
| `archetype_volume_timeseries` | 6796353 | [View on Dune](https://dune.com/queries/6796353) |
| `archetype_transfer_size_distribution` | 6796354 | [View on Dune](https://dune.com/queries/6796354) |
| `archetype_supply_snapshot` | 6796356 | [View on Dune](https://dune.com/queries/6796356) |
| `stress_event_overlay` | 6796357 | [View on Dune](https://dune.com/queries/6796357) |

Each query targets USDC transfers on Ethereum using Dune's public `ethereum.token_transfers` and `tokens.erc20` schemas.

---

## Guardrails

This tool is designed as a **KYC intelligence tool**, not a surveillance or transaction-monitoring tool. The following guardrails are enforced throughout the stack:

- **Aggregation only** — every API response contains archetype-level rows. No wallet addresses, no transaction hashes, no individual records are ever returned.
- **No alerting** — there are no flags, severity scores, or case-management hooks.
- **KYC framing** — every chart includes a note explaining the specific KYC design question it informs.
- **Data provenance** — every API response includes the Dune query ID and a `fetched_at` timestamp, surfaced in the UI Methodology Panel.
- **Public data only** — all data is sourced from the public Ethereum ledger via Dune's public schema. No private or internal records are used.

---

## Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Set your Dune API key (get one free at dune.com/settings/api)
export DUNE_API_KEY=your_key_here

# 3. Start the frontend dev server
npm run dev
# Runs at http://localhost:5173

# 4. To also run the serverless API locally, use the Vercel CLI:
npm install -g vercel
vercel dev
# API available at http://localhost:3000/api/archetype
```

---

## Deploying to Vercel

1. Push the repo to GitHub and import it into Vercel.
2. Add one environment variable in Vercel project settings:

   | Variable | Value |
   |---|---|
   | `DUNE_API_KEY` | Your Dune Analytics API key — **never commit this to the repo** |

3. Vercel automatically deploys `api/archetype.js` as a serverless function and serves the Vite build as a static site.
4. The frontend calls `/api/archetype` on the same origin — no CORS configuration needed.

---

## API Contract

```
GET /api/archetype?start=YYYY-MM-DD&end=YYYY-MM-DD&token=USDC
```

Example response:

```json
{
  "dune_query_id": "6796353",
  "fetched_at": "2025-01-01T00:00:00Z",
  "data": [
    {
      "date": "2025-01-01",
      "archetype": "exchanges",
      "volume_usd": 1234567.89,
      "tx_count": 4210,
      "median_size": 500.00,
      "pct90_size": 25000.00
    }
  ]
}
```

---

## Repo Structure

```
stablecoin-risk-explorer/
├── README.md
├── CONTEXT.md                        ← project brief and session rules
├── metrics.md                        ← archetype definitions and metric rationale
├── api/
│   └── archetype.js                  ← Vercel serverless function
├── dune/
│   ├── archetype_volume_timeseries.sql
│   ├── archetype_transfer_size_distribution.sql
│   ├── archetype_supply_snapshot.sql
│   └── stress_event_overlay.sql
├── src/
│   ├── App.jsx
│   ├── components/
│   │   ├── VolumeChart.jsx           ← stacked area chart
│   │   ├── SizeDistributionChart.jsx
│   │   ├── KpiCards.jsx
│   │   └── MethodologyPanel.jsx      ← query IDs + data provenance
│   └── hooks/
│       └── useArchetypeData.js
└── vite.config.js
```

---

## Methodology

Archetype definitions, metric rationale, and KYC interpretation notes are documented in [metrics.md](metrics.md).

---

## Data Notice

All data is sourced from the public Ethereum blockchain via [Dune Analytics](https://dune.com). This tool does not use or display any private, internal, or off-chain records. On-chain transaction data is publicly available by design; no personal data is processed.