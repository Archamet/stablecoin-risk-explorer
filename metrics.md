# Stablecoin Risk Explorer — Archetypes & Metrics

---

## Archetypes

### 1. Exchanges

**Definition.** Centralised exchanges (CEXs) act as on/off ramps between fiat and crypto, pooling user funds in exchange-controlled deposit and withdrawal addresses. They are the dominant counterparty for retail stablecoin flows and typically operate under money-service-business or virtual-asset-service-provider licences. Transfer patterns are characterised by high frequency, moderate median size, and strong intraday periodicity driven by user trading cycles.

**Example entity types.** Spot exchange hot wallets, withdrawal fee pools, margin-funding addresses, exchange-operated OTC desks.

**Dune label mapping.** Include addresses where `label_type = 'cex'` or `label_subtype IN ('exchange', 'dex_aggregator_cex')` in the Dune `labels` table. Exclude addresses also tagged `defi` to avoid AMM routing contracts misclassified as exchange wallets.

---

### 2. Custody / Treasury

**Definition.** Institutional custodians and corporate treasury operations hold stablecoins on behalf of clients or as working capital, typically in cold or warm wallets with infrequent but large-value movements. Flows reflect settlement cycles, payroll, or balance-sheet rebalancing rather than end-user activity. This archetype carries the highest average transfer size and lowest transfer frequency of the five.

**Example entity types.** Qualified custodians (Anchorage, BitGo, Coinbase Custody), DAO treasuries, corporate treasury multisigs, endowment reserve wallets.

**Dune label mapping.** Include addresses where `label_type IN ('custody', 'institution')` or `label_subtype IN ('treasury', 'multisig', 'dao_treasury')`. Cross-reference with known custodian address lists published by Circle (USDC) where available.

---

### 3. Payment Processors

**Definition.** Payment processors use stablecoins as a settlement rail for merchant payments, B2B invoicing, or payroll disbursement, routing funds between businesses rather than speculative traders. Transfer sizes cluster tightly around invoice or salary amounts, and volume is strongly correlated with business-day calendars. This archetype is the clearest signal of real-economy stablecoin adoption.

**Example entity types.** Merchant acquirers (Checkout.com, Stripe crypto), payroll platforms (Bitwage, Request Finance), B2B settlement hubs, accounts-payable automation contracts.

**Dune label mapping.** Include addresses where `label_type = 'payment'` or `label_subtype IN ('merchant', 'payroll', 'b2b_settlement')`. Where Dune labels are absent, supplement with addresses self-identified in contract metadata or press announcements.

---

### 4. DeFi Protocols

**Definition.** DeFi protocols — including AMMs, lending markets, and yield aggregators — hold and route stablecoins as collateral, liquidity, or interest-bearing assets governed entirely by smart contracts. Flows are determined by on-chain governance and arbitrage bots rather than human instruction, producing highly irregular transfer sizes and 24/7 activity with no business-day seasonality. Concentration risk is elevated because small numbers of protocol contracts control large fractions of supply.

**Example entity types.** AMM liquidity pools (Uniswap, Curve), lending protocol reserves (Aave, Compound), yield aggregator vaults (Yearn), liquid-staking wrappers, stablecoin minting engines (MakerDAO).

**Dune label mapping.** Include addresses where `label_type = 'defi'` or `label_subtype IN ('dex', 'lending', 'yield', 'amm', 'vault')`. Exclude router/aggregator contracts that merely pass funds through without holding balances, to avoid inflating volume figures.

---

### 5. Bridges / Wrapped

**Definition.** Bridge and wrapped-token contracts lock native stablecoins on one chain and mint or release synthetic equivalents on another, acting as cross-chain liquidity hubs. A single large lock/unlock event can represent hundreds of underlying user transactions, making per-transfer metrics misleading without normalisation. Stress periods show disproportionate inflows as users flee to perceived-safer chains, making this archetype a leading indicator of systemic risk episodes.

**Example entity types.** Native bridge escrow contracts (Arbitrum, Optimism, Polygon PoS), third-party bridge lock contracts (Hop, Across, Stargate), wrapped-USDC minting authorities, canonical token messengers (CCTP).

**Dune label mapping.** Include addresses where `label_type = 'bridge'` or `label_subtype IN ('cross_chain', 'wrapped', 'canonical_bridge', 'cctp')`. Flag contracts where a single address holds >5 % of circulating supply as a concentration note in the Methodology Panel.

---

## Primary Metrics

### Metric 1 — Volume Share by Archetype (USD)

**Description.** Daily USD volume of USDC transfers attributed to each archetype, expressed both in absolute terms and as a percentage share of total ecosystem volume. Calculated as the sum of `value / 1e6` for all transfers where the `to_address` or `from_address` matches an archetype label, avoiding double-counting by attributing each transfer to the highest-priority archetype of the receiving address.

**Dune field.** `volume_usd` (daily aggregate per archetype, from `archetype_volume_timeseries.sql`).

**KYC design question.** Which archetypes dominate stablecoin flow, and does the relative share shift during product onboarding or regulatory changes? Informs whether a KYC programme should weight resources toward exchange-linked or DeFi-linked customer segments.

---

### Metric 2 — Transfer Count by Archetype

**Description.** Daily count of discrete USDC transfer events attributed to each archetype. Unlike volume, transfer count reflects the number of individual instructions rather than their aggregate value, making it a proxy for user-base breadth. A high count with low volume indicates retail or micropayment activity; the inverse suggests wholesale or institutional flows.

**Dune field.** `tx_count` (daily aggregate per archetype, from `archetype_volume_timeseries.sql`).

**KYC design question.** Is the archetype's growth driven by more customers or larger transactions? Informs whether enhanced due diligence thresholds should be set at the customer count level (breadth) or the transaction value level (depth).

---

### Metric 3 — Median Transfer Size per Archetype

**Description.** The 50th-percentile USD value of individual transfers within an archetype, computed daily. Median is preferred over mean because stablecoin distributions are heavily right-skewed; a single whale transaction can otherwise dominate average figures. Stable medians confirm consistent use-case behaviour; rising medians may signal institutionalisation of a previously retail archetype.

**Dune field.** `median_size` (daily per archetype, from `archetype_transfer_size_distribution.sql`).

**KYC design question.** What is the typical transaction ticket for this archetype, and does it exceed standard CDD monetary thresholds? Informs whether simplified or standard due diligence is appropriate for the archetype's modal customer.

---

### Metric 4 — 90th Percentile Transfer Size per Archetype

**Description.** The 90th-percentile USD value of individual transfers within an archetype, computed daily. This captures the behaviour of the large-transaction tail without being distorted by single outliers, and is more stable than the maximum. A widening gap between the median (Metric 3) and the 90th percentile signals growing intra-archetype heterogeneity — often a sign that high-value institutional actors are entering a previously retail-dominated archetype.

**Dune field.** `pct90_size` (daily per archetype, from `archetype_transfer_size_distribution.sql`).

**KYC design question.** How large are the biggest routine transactions in this archetype, and should a separate enhanced-due-diligence tier be triggered above this threshold? Informs calibration of transaction monitoring alert thresholds without the noise of one-off outliers.

---

### Metric 5 — Share of Circulating Supply Routed via Archetype

**Description.** A stock measure: the fraction of total USDC circulating supply currently held in addresses attributed to each archetype, calculated from a daily balance snapshot. Unlike flow metrics, this captures concentration at rest — where supply is parked, not just transiting. An archetype holding >30 % of supply warrants scrutiny as a single point of failure or regulatory pressure point.

**Dune field.** `supply_share_pct` (daily snapshot per archetype, from `archetype_supply_snapshot.sql`).

**KYC design question.** Is stablecoin supply becoming concentrated in a single archetype or entity class? Informs systemic-risk sections of enterprise-wide KYC risk appetite statements and informs decisions about whether to offer custodial services to that archetype.

---

### Metric 6 — Net Inflow / Outflow per Archetype (Rolling 7-Day)

**Description.** The rolling 7-day net USD flow into each archetype: sum of inbound transfers minus sum of outbound transfers, smoothed over seven days to reduce daily noise. Positive values indicate the archetype is accumulating supply; negative values indicate it is distributing. Persistent negative net flows from exchanges often precede market sell-off events.

**Dune field.** Derived: `SUM(inbound_volume_usd) - SUM(outbound_volume_usd)` over a 7-day rolling window, from `archetype_volume_timeseries.sql`. Exposed in the API as `net_flow_7d_usd`.

**KYC design question.** Is a particular archetype acting as a net absorber or distributor of stablecoin supply over the medium term? Informs sector-level risk ratings — sustained outflows from DeFi protocols, for instance, may signal protocol risk that affects the stablecoin's institutional-grade suitability.

---

### Metric 7 — Volume Share During Stress Windows (Event Overlay)

**Description.** The proportion of total ecosystem volume attributable to each archetype during pre-defined stress periods (e.g., USDC depeg March 2023, FTX collapse November 2022, Silvergate/SVB weekend March 2023). Calculated by restricting the volume query to the stress window date range and comparing archetype shares against the baseline 90-day average. Large deviations indicate which archetypes act as safe-haven destinations or panic exit routes.

**Dune field.** Derived from `archetype_volume_timeseries.sql` filtered by stress-event date ranges defined in `stress_event_overlay.sql`. Exposed as `stress_volume_share_pct` and `stress_vs_baseline_delta_pct`.

**KYC design question.** Which archetypes experience atypical volume surges during market stress, and does your institution have KYC coverage for the counterparties driving those surges? Informs contingency-KYC plans and the list of archetype relationships that require pre-approved EDD procedures ready to activate during stress events.

---

*Data source: Dune Analytics, USDC token transfers on Ethereum mainnet (`erc20_ethereum.evt_Transfer` where `contract_address = 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48`). Public onchain data only — no internal records, no wallet attribution beyond published Dune labels.*
