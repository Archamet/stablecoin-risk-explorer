-- archetype_supply_snapshot.sql
-- Current USDC balance held by each archetype as a share of total
-- circulating supply, derived entirely from ethereum.token_transfers.
--
-- Approach:
--   Balance is computed as the net of all inflows (transfers received)
--   minus all outflows (transfers sent) per address, from genesis to now.
--   The zero address (0x000...000) is excluded from both sides — it is the
--   mint/burn counterparty and does not represent real holdings.
--   Total circulating supply is the sum of all positive balances,
--   which equals the sum of inflows minus burns.
--
-- Tables used:
--   ethereum.token_transfers  – one row per ERC-20 transfer event
--   labels.addresses          – Dune community labels keyed on (blockchain, address)
--
-- Archetype mapping (same priority order as other queries in this project):
--   Bridge/Wrapped    → label_type contains 'bridge'
--   DeFi Protocol     → label_type contains 'defi'
--   Payment Processor → label_type contains 'payment'
--   Custody/Treasury  → label_type contains 'custody' or 'treasury'
--   Exchange          → label_type contains 'cex' or 'exchange'
--   unknown           → no matching label found (COALESCE fallback)

WITH

-- 1. Compute net balance per address by summing inflows and outflows
--    across all USDC transfers on Ethereum mainnet.
--    The zero address is the mint/burn counterparty; exclude it so it does
--    not appear as a holder and does not distort the total supply figure.
address_balances AS (
    SELECT
        address,
        SUM(net_amount_usd) AS balance_usd
    FROM (
        -- Inflows: address received USDC
        SELECT
            "to"          AS address,
            value / 1e6   AS net_amount_usd   -- positive contribution
        FROM ethereum.token_transfers
        WHERE contract_address = 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48  -- USDC on Ethereum mainnet
          AND "to" != 0x0000000000000000000000000000000000000000             -- exclude mint/burn address

        UNION ALL

        -- Outflows: address sent USDC
        SELECT
            "from"          AS address,
            -(value / 1e6)  AS net_amount_usd  -- negative contribution
        FROM ethereum.token_transfers
        WHERE contract_address = 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48
          AND "from" != 0x0000000000000000000000000000000000000000
    ) flows
    GROUP BY address
),

-- 2. Keep only addresses with a positive balance.
--    Dust rounding can produce tiny negative values; filter them out.
positive_balances AS (
    SELECT address, balance_usd
    FROM address_balances
    WHERE balance_usd > 0
),

-- 3. Resolve each address to a single archetype label.
--    Same label join used in the other project queries.
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

-- 4. Attach archetype to each address balance.
labeled_balances AS (
    SELECT
        COALESCE(l.archetype, 'unknown') AS archetype,
        b.balance_usd
    FROM positive_balances b
    LEFT JOIN deduped_labels l
        ON b.address = l.address
),

-- 5. Sum balances per archetype and compute the total across all archetypes
--    in the same pass, to avoid a second full-table scan.
archetype_totals AS (
    SELECT
        archetype,
        SUM(balance_usd)                       AS archetype_balance_usd,
        SUM(SUM(balance_usd)) OVER ()          AS total_supply_usd   -- window across all archetype rows
    FROM labeled_balances
    GROUP BY archetype
)

-- 6. Final output: balance per archetype, total supply, and share.
--    supply_share_pct is the percentage of circulating USDC held by that archetype.
SELECT
    archetype,
    ROUND(archetype_balance_usd, 2)                                          AS balance_usd,
    ROUND(total_supply_usd, 2)                                               AS total_supply_usd,
    ROUND(100.0 * archetype_balance_usd / total_supply_usd, 4)              AS supply_share_pct
FROM archetype_totals
ORDER BY archetype_balance_usd DESC
