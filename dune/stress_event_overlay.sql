-- stress_event_overlay.sql
-- Net inflow/outflow per archetype per day for USDC on Ethereum,
-- covering the ±7 day window around a parameterised stress event date.
--
-- Intended use: paste this query into Dune Analytics, publish it, then use
-- the "Parameters" panel (top-right of the query editor) to set event_date.
-- The parameter is declared below with a default; Dune will render it as a
-- date-picker widget when the query is saved with type = date.
--
-- How to set event_date in the Dune UI:
--   1. Open the query in Dune Analytics.
--   2. Click the "Parameters" tab in the right-hand panel.
--   3. Set Name = "event_date", Type = "date", Default = "2023-03-10"
--      (or any date that corresponds to the stress event you want to analyse,
--      e.g. 2023-03-10 for the USDC depeg around Silicon Valley Bank).
--   4. Re-run the query. The window shifts automatically to event_date ± 7 days.
--   5. When calling this query via the Dune API, pass the parameter as:
--      query_parameters: { "event_date": "YYYY-MM-DD" }
--
-- Tables used:
--   tokens.transfers          – one row per ERC-20 transfer event (Dune V2 spell)
--   labels.addresses          – Dune community labels keyed on (blockchain, address)
--
-- Net flow definition (per address per day):
--   inflow  = USDC received by the address
--   outflow = USDC sent by the address
--   net     = inflow − outflow  (positive = net receiver, negative = net sender)
--
-- Archetype mapping (same priority order as other project queries):
--   Bridge/Wrapped    → label_type contains 'bridge'
--   DeFi Protocol     → label_type contains 'defi'
--   Payment Processor → label_type contains 'payment'
--   Custody/Treasury  → label_type contains 'custody' or 'treasury'
--   Exchange          → label_type contains 'cex' or 'exchange'
--   unknown           → no matching label found (COALESCE fallback)

WITH

-- Parameter placeholder.
-- Replace the literal date string with {{event_date}} when saving in Dune
-- so the UI renders a date-picker widget.
params AS (
    SELECT CAST('{{event_date}}' AS DATE) AS event_date
),

-- 1. Derive the ±7 day window boundaries from the event date.
window_bounds AS (
    SELECT
        event_date,
        event_date - INTERVAL '7' DAY  AS window_start,
        event_date + INTERVAL '7' DAY  AS window_end
    FROM params
),

-- 2. Pull all USDC transfers that fall inside the window.
--    The zero address is the mint/burn counterparty; it is excluded from
--    both sides so mint/burn flows do not inflate archetype figures.
windowed_transfers AS (
    SELECT
        date_trunc('day', t.block_time)  AS day,
        t."to"                           AS recipient,
        t."from"                         AS sender,
        t.amount_usd
    FROM tokens.transfers t
    CROSS JOIN window_bounds w
    WHERE t.blockchain    = 'ethereum'
      AND t.contract_address = 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48  -- USDC on Ethereum mainnet
      AND t.block_time >= CAST(w.window_start AS TIMESTAMP)
      AND t.block_time <  CAST(w.window_end   AS TIMESTAMP) + INTERVAL '1' DAY
      AND t."to"   != 0x0000000000000000000000000000000000000000
      AND t."from" != 0x0000000000000000000000000000000000000000
),

-- 3. Decompose each transfer into a signed flow per (day, address) pair.
--    Each transfer row generates two signed contribution rows:
--      +amount_usd against the recipient (inflow)
--      -amount_usd against the sender    (outflow)
signed_flows AS (
    SELECT day, recipient AS address,  amount_usd AS flow_usd FROM windowed_transfers
    UNION ALL
    SELECT day, sender    AS address, -amount_usd AS flow_usd FROM windowed_transfers
),

-- 4. Resolve each address to a single archetype label.
--    Same label join used in other project queries.
best_label AS (
    SELECT
        address,
        CASE
            WHEN lower(label_type) LIKE '%bridge%'   THEN 'Bridge/Wrapped'
            WHEN lower(label_type) LIKE '%defi%'     THEN 'DeFi Protocol'
            WHEN lower(label_type) LIKE '%payment%'  THEN 'Payment Processor'
            WHEN lower(label_type) LIKE '%custody%'
              OR lower(label_type) LIKE '%treasury%' THEN 'Custody/Treasury'
            WHEN lower(label_type) LIKE '%cex%'
              OR lower(label_type) LIKE '%exchange%' THEN 'Exchange'
            ELSE NULL
        END AS archetype,
        ROW_NUMBER() OVER (
            PARTITION BY address
            ORDER BY
                CASE
                    WHEN lower(label_type) LIKE '%bridge%'   THEN 1
                    WHEN lower(label_type) LIKE '%defi%'     THEN 2
                    WHEN lower(label_type) LIKE '%payment%'  THEN 3
                    WHEN lower(label_type) LIKE '%custody%'
                      OR lower(label_type) LIKE '%treasury%' THEN 4
                    WHEN lower(label_type) LIKE '%cex%'
                      OR lower(label_type) LIKE '%exchange%' THEN 5
                    ELSE 6
                END
        ) AS rn
    FROM labels.addresses
    WHERE blockchain = 'ethereum'
),

deduped_labels AS (
    SELECT address, archetype
    FROM best_label
    WHERE rn = 1
),

-- 5. Attach archetype to each signed flow row.
labeled_flows AS (
    SELECT
        f.day,
        COALESCE(l.archetype, 'unknown') AS archetype,
        f.flow_usd
    FROM signed_flows f
    LEFT JOIN deduped_labels l
        ON f.address = l.address
)

-- 6. Aggregate to daily archetype-level net flows.
--    net_flow_usd > 0 means the archetype was a net receiver on that day.
--    net_flow_usd < 0 means the archetype was a net sender (capital leaving).
--    days_from_event lets the frontend centre the x-axis on the event date.
SELECT
    f.day                                                       AS date,
    f.archetype,
    SUM(CASE WHEN f.flow_usd > 0 THEN  f.flow_usd ELSE 0 END) AS inflow_usd,
    SUM(CASE WHEN f.flow_usd < 0 THEN -f.flow_usd ELSE 0 END) AS outflow_usd,
    SUM(f.flow_usd)                                            AS net_flow_usd,
    date_diff('day', CAST(w.event_date AS TIMESTAMP), f.day)   AS days_from_event
FROM labeled_flows f
CROSS JOIN window_bounds w
GROUP BY f.day, f.archetype, w.event_date
ORDER BY f.day ASC, f.archetype
