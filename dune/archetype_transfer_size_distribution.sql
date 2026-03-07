-- archetype_transfer_size_distribution.sql
-- Median and 90th-percentile transfer size (USD) for USDC on Ethereum,
-- per archetype per day.
--
-- Tables used:
--   ethereum.token_transfers  – one row per ERC-20 transfer event
--   labels.addresses          – Dune community labels keyed on (blockchain, address)
--
-- Archetype mapping (same priority order as archetype_volume_timeseries.sql):
--   Bridge/Wrapped    → label_type contains 'bridge'
--   DeFi Protocol     → label_type contains 'defi'
--   Payment Processor → label_type contains 'payment'
--   Custody/Treasury  → label_type contains 'custody' or 'treasury'
--   Exchange          → label_type contains 'cex' or 'exchange'
--   unknown           → no matching label found (COALESCE fallback)
--
-- approx_percentile is used instead of percentile_cont for performance;
-- accuracy is more than sufficient for archetype-level analysis.

WITH

-- 1. Filter token_transfers to USDC on Ethereum only.
--    value is in raw units (6 decimals); divide by 1e6 to get USD.
usdc_transfers AS (
    SELECT
        date_trunc('day', block_time)          AS day,
        "to"                                   AS recipient,
        value / 1e6                            AS amount_usd   -- USDC has 6 decimals; 1 USDC ≈ $1
    FROM ethereum.token_transfers
    WHERE contract_address = 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48  -- USDC on Ethereum mainnet
      AND block_time >= TIMESTAMP '2023-01-01'                             -- configurable lookback
),

-- 2. Resolve each recipient address to a single archetype label.
--    A single address may have multiple label rows; ROW_NUMBER picks the most
--    specific match (lower rank number = higher specificity).
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

-- Deduplicate to one label row per address.
deduped_labels AS (
    SELECT address, archetype
    FROM best_label
    WHERE rn = 1
),

-- 3. Attach archetype to each transfer via LEFT JOIN.
--    COALESCE maps unlabelled recipients to 'unknown'.
labeled_transfers AS (
    SELECT
        t.day,
        COALESCE(l.archetype, 'unknown') AS archetype,
        t.amount_usd
    FROM usdc_transfers t
    LEFT JOIN deduped_labels l
        ON t.recipient = l.address
)

-- 4. Compute approximate percentiles per archetype per day.
--    approx_percentile(value, p) returns the p-th percentile using a T-Digest sketch.
--    tx_count is included so the consumer can assess statistical reliability per bucket.
SELECT
    day                                            AS date,
    archetype,
    COUNT(*)                                       AS tx_count,
    approx_percentile(amount_usd, 0.5)            AS median_size_usd,
    approx_percentile(amount_usd, 0.9)            AS p90_size_usd
FROM labeled_transfers
GROUP BY 1, 2
ORDER BY 1 DESC, 2
