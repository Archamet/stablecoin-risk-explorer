# Stablecoin Use-Case Risk Explorer

A public dashboard that maps on-chain stablecoin behaviour to KYC design choices. Rather than monitoring individual transactions or wallets, the tool classifies stablecoin flows into five ecosystem archetypes (Exchanges, Custody/Treasury, Payment Processors, DeFi Protocols, Bridges/Wrapped) and surfaces aggregate, population-level metrics — median transfer size, volume share, supply concentration — that a second-line compliance function can use when calibrating due-diligence thresholds, risk appetite statements, and product-specific KYC controls. All outputs are anonymised, archetype-level aggregates. No wallet addresses, no individual transaction records, and no alerting logic are present anywhere in the stack.

## Architecture

```
Browser
  |
  | HTTPS (static assets + JS bundle)
  v
Vercel Frontend (React + Vite, static CDN)
  |
  | fetch /api/archetype?start=...&end=...&token=USDC
  v
Vercel Serverless API (Node.js, api/archetype.js)
  |  - holds DUNE_API_KEY in environment (never exposed to browser)
  |  - 15-minute in-memory cache per query key
  |
  | Dune Analytics REST API (api.dune.com)
  v
Dune Analytics API
  |
  | public USDC on Ethereum schema
  v
Pre-published SQL queries (see query IDs below)
```

## Guardrails

- **Aggregation only** — responses contain archetype-level rows; no wallet addresses, no tx hashes, no individual records are ever returned.
- **No addresses** — the API contract and every UI component are audited to ensure no `address` field is present.
- **No alerting** — there are no flags, severity scores, or case-management hooks. This is an intelligence tool, not a surveillance tool.
- **KYC framing** — every chart includes a "This metric informs KYC design question: ..." note, keeping the tool oriented toward policy calibration rather than transaction monitoring.
- **Data provenance** — every API response includes the Dune query ID and a `fetched_at` timestamp; these are surfaced in the UI Methodology Panel.
- **Public data only** — all data is sourced from the public Ethereum ledger via Dune's public schema. No private or internal records are used.

## Running Locally

```bash
# Install dependencies
npm install

# Set your Dune API key (obtain from dune.com/settings/api)
export DUNE_API_KEY=your_key_here

# Start the Vite dev server (frontend only, no serverless API)
npm run dev

# To test the serverless API locally, use the Vercel CLI:
npm install -g vercel
vercel dev
```

The frontend dev server runs at `http://localhost:5173`. When using `vercel dev`, the API is available at `http://localhost:3000/api/archetype`.

## Reproducing the Dune Queries

All SQL queries are saved in the `dune/` directory and published on Dune Analytics. To inspect or fork them, visit:

| Query | ID | Link |
|---|---|---|
| archetype_volume_timeseries | 6796353 | https://dune.com/queries/6796353 |
| archetype_transfer_size_distribution | 6796354 | https://dune.com/queries/6796354 |
| archetype_supply_snapshot | 6796356 | https://dune.com/queries/6796356 |
| stress_event_overlay | 6796357 | https://dune.com/queries/6796357 |

Each query targets USDC transfers on Ethereum using Dune's public `ethereum.token_transfers` and `tokens.erc20` schemas. Archetype classification is applied via a CASE statement in the SQL keyed on a curated list of labelled contract addresses (sourced from Dune's `labels` table).

## Deployment (Vercel)

1. Push the repo to GitHub and import it into Vercel.
2. Set the following environment variable in the Vercel project settings:

   | Variable | Description |
   |---|---|
   | `DUNE_API_KEY` | Your Dune Analytics API key (never commit this to the repo) |

3. Vercel will automatically deploy `api/archetype.js` as a serverless function and serve the Vite build as a static site.
4. The frontend reads the API at `/api/archetype` (same origin), so no CORS configuration is required.

## Methodology

Archetype definitions, metric rationale, and KYC interpretation notes are documented in [metrics.md](metrics.md). That file explains how each archetype is classified, what each metric measures, and the specific KYC design question each chart is intended to inform.
