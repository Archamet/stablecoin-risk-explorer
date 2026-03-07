# Stablecoin Use-Case Risk Explorer — CONTEXT.md

## Project Goal
A small web tool that maps stablecoin ecosystem behaviour to KYC design choices.
- Outputs are **aggregate and archetype-level only** (no wallet drill-downs)
- Framed as **KYC-by-design intelligence**, not transaction monitoring
- Demonstrates product/technical fluency and second-line judgement
- Final deliverable: public portfolio link to a live, usable dashboard

---

## Stack
- **Data**: Dune Analytics queries (USDC on Ethereum, public schema)
- **API**: Node.js serverless function (Vercel), holds Dune API key, caches responses
- **Frontend**: React + Vite, Recharts, static deploy on Vercel
- **Repo**: GitHub + CI/CD via Vercel GitHub integration

---

## Repo Structure (target)
```
stablecoin-risk-explorer/
├── CONTEXT.md                  ← this file (always read first)
├── README.md
├── metrics.md                  ← archetype definitions + metric defs
├── api/
│   └── archetype.js            ← Vercel serverless function
├── dune/
│   ├── archetype_volume_timeseries.sql
│   ├── archetype_transfer_size_distribution.sql
│   ├── archetype_supply_snapshot.sql
│   └── stress_event_overlay.sql
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── components/
│   │   ├── NavBar.jsx
│   │   ├── ArchetypeSelector.jsx
│   │   ├── TimeRangeSelector.jsx
│   │   ├── VolumeChart.jsx          ← stacked area, volume by archetype
│   │   ├── SizeDistributionChart.jsx ← boxplot/violin for transfer sizes
│   │   ├── KpiCards.jsx             ← share of supply, concentration
│   │   ├── KycImplicationCard.jsx   ← 1-2 line KYC note per chart
│   │   └── MethodologyPanel.jsx     ← Dune query IDs + assumptions
│   └── hooks/
│       └── useArchetypeData.js
├── public/
└── vite.config.js
```

---

## Archetypes
1. **Exchanges** — centralised exchange deposit/withdrawal addresses
2. **Custody / Treasury** — institutional custodians, corporate treasury
3. **Payment Processors** — merchant settlement, B2B payment rails
4. **DeFi Protocols** — AMMs, lending, yield aggregators
5. **Bridges / Wrapped** — cross-chain bridges, wrapped token contracts

---

## Primary Metrics (per archetype)
1. Volume share by archetype (USD) — daily time series
2. Count of transfers by archetype — daily time series
3. Median transfer size per archetype
4. 90th percentile transfer size per archetype
5. Share of circulating supply routed via archetype (stock measure)
6. Net inflow/outflow to archetype (rolling 7-day)
7. Volume share during stress windows (event overlay)

---

## API Contract
`GET /api/archetype?start=YYYY-MM-DD&end=YYYY-MM-DD&token=USDC`

Response:
```json
{
  "dune_query_id": "XXXXXXX",
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

## Guardrails (MUST enforce in every change)
- **No addresses** in API response or UI — ever
- **No alerting** — no flags, severity scores, or case management hooks
- **KYC framing required** — every chart must show: "This metric informs KYC design question: ..."
- **Data provenance** — Dune query IDs + fetched_at timestamp always visible
- **Privacy note** — short note that this is public onchain data, not internal records

---

## Phases
- **Phase A** — Planning & metrics (`metrics.md`)
- **Phase B** — Dune SQL queries + validation
- **Phase C** — Serverless API (Vercel function)
- **Phase D** — React frontend + charts
- **Phase E** — QA, governance, demo prep
- **Phase F** — Repo, docs, handoff

---

## Current Status
> Update this section after each session.

- [ ] Phase A: metrics.md written
- [ ] Phase B: Dune queries published
- [ ] Phase C: API deployed
- [ ] Phase D: Frontend deployed
- [ ] Phase E: QA complete
- [ ] Phase F: Repo public + demo link live

---

## Key Decisions & Notes
- Cache TTL: 15 minutes in-memory on serverless cold starts
- Dune API key stored only in Vercel environment variables — never in code
- Use `recharts` not Chart.js (better React integration)
- Vite for local dev speed; deploy target is Vercel
- No database — MVP uses only Dune API + serverless cache

---

## Claude Code Session Rules (read before every session)
1. Fresh session for every task — click + in Claude Code panel
2. Always start with "Read CONTEXT.md" — gives context without long history
3. Stop after 3 minutes if thinking — it has looped
4. One change per session — never combine multiple changes
5. str_replace edits only — do not rewrite files
6. Commit after every successful change