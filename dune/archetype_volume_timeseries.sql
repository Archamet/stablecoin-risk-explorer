-- archetype_volume_timeseries.sql
-- Daily USD volume and transfer count for USDC on Ethereum,
-- grouped by recipient archetype label.
--
-- Tables used:
--   tokens.transfers          – one row per ERC-20 transfer event (Dune V2 spell)
--   labels.addresses          – Dune community labels keyed on (blockchain, address)
--
-- Archetype mapping:
--   Exchange          → label_type contains 'cex'
--   Custody/Treasury  → label_type contains 'custody' or 'treasury'
--   Payment Processor → label_type contains 'payment'
--   DeFi Protocol     → label_type contains 'defi'
--   Bridge/Wrapped    → label_type contains 'bridge'
--   unknown           → no matching label found (COALESCE fallback)

WITH

-- 1. Filter tokens.transfers to USDC on Ethereum only.
--    tokens.transfers is the Dune V2 spell; amount_usd is pre-computed by the spell.
usdc_transfers AS (
    SELECT
        date_trunc('day', block_time)          AS day,
        "to"                                   AS recipient,
        amount_usd
    FROM tokens.transfers
    WHERE blockchain    = 'ethereum'
      AND token_address = 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48  -- USDC on Ethereum mainnet
      AND block_time   >= TIMESTAMP '2023-01-01'                        -- configurable lookback
),

-- 2. Join each transfer's recipient address to the labels table.
--    labels.addresses holds curated tags; a single address may have multiple rows,
--    so we pick the single most specific label via ROW_NUMBER before joining.
--    We keep only Ethereum-scoped labels to avoid cross-chain collisions.
best_label AS (
    SELECT
        address,
        -- Collapse label_type to our five archetypes; order matters (first match wins).
        CASE
            WHEN lower(label_type) LIKE '%bridge%'   THEN 'Bridge/Wrapped'
            WHEN lower(label_type) LIKE '%defi%'     THEN 'DeFi Protocol'
            WHEN lower(label_type) LIKE '%payment%'  THEN 'Payment Processor'
            WHEN lower(label_type) LIKE '%custody%'
              OR lower(label_type) LIKE '%treasury%' THEN 'Custody/Treasury'
            WHEN lower(label_type) LIKE '%cex%'
              OR lower(label_type) LIKE '%exchange%' THEN 'Exchange'
            ELSE NULL                                 -- will be handled by COALESCE below
        END AS archetype,
        -- Rank so we can keep one row per address; prefer non-NULL archetypes first.
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

-- 3. Attach the archetype label to each transfer.
--    LEFT JOIN preserves transfers where the recipient has no label.
--    COALESCE maps NULL (no label found) to the literal string 'unknown',
--    ensuring every row belongs to an archetype bucket.
labeled_transfers AS (
    SELECT
        t.day,
        COALESCE(l.archetype, 'unknown') AS archetype,  -- fallback: address has no Dune label
        t.amount_usd
    FROM usdc_transfers t
    LEFT JOIN deduped_labels l
        ON t.recipient = l.address
)

-- 4. Aggregate to daily archetype-level totals.
--    volume_usd: sum of transfer amounts in USD
--    tx_count:   number of individual transfer events
SELECT
    day                    AS date,
    archetype,
    SUM(amount_usd)        AS volume_usd,
    COUNT(*)               AS tx_count
FROM labeled_transfers
GROUP BY 1, 2
ORDER BY 1 DESC, 2
