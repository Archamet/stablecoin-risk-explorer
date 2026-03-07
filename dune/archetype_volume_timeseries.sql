-- archetype_volume_timeseries.sql
-- Daily USD volume and transfer count for USDC on Ethereum,
-- grouped by recipient archetype label.
--
-- Tables used:
--   tokens.transfers  – one row per ERC-20 transfer event (Dune V2 spell)
--
-- Archetype mapping (hardcoded known_labels CTE):
--   Exchange          → major CEX hot/cold wallets (Binance, Coinbase, OKX)
--   Custody/Treasury  → BitGo, Fireblocks, FTX
--   Payment Processor → Circle treasury addresses
--   DeFi Protocol     → Uniswap, Aave, 1inch, Sushiswap, etc.
--   Bridge/Wrapped    → Wormhole, Polygon, Optimism, Arbitrum, Avalanche
--   unknown           → no matching address found (COALESCE fallback)

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
      AND contract_address = 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48  -- USDC on Ethereum mainnet
      AND block_time   >= TIMESTAMP '2024-01-01'                        -- configurable lookback
),

-- 2. Hardcoded archetype labels for known major addresses.
--    Replaces the labels.addresses join which returns near-zero matches.
known_labels AS (
    SELECT address, archetype FROM (VALUES
        -- Exchanges
        ('0x28c6c06298d514db089934071355e5743bf21d60', 'Exchange'),  -- Binance hot wallet
        ('0x21a31ee1afc51d94c2efccaa2092ad1028285549', 'Exchange'),  -- Binance cold wallet
        ('0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503', 'Exchange'),  -- Binance 14
        ('0xdfd5293d8e347dfe59e90efd55b2956a1343963d', 'Exchange'),  -- Binance 15
        ('0x56eddb7aa87536c09ccc2793473599fd21a8b17f', 'Exchange'),  -- Binance 16
        ('0xbe0eb53f46cd790cd13851d5eff43d12404d33e8', 'Exchange'),  -- Binance cold 2
        ('0x5041ed759dd4afc3a72b8192c143f72f47240816', 'Exchange'),  -- OKX hot wallet
        ('0x6cc5f688a315f3dc28a7781717a9a798a59fda7b', 'Exchange'),  -- OKX 2
        ('0xeb2629a2734e272bcc07bda959863f316f4bd4cf', 'Exchange'),  -- Coinbase hot wallet
        ('0xa9d1e08c7793af67e9d92fe308d5697fb81d3e43', 'Exchange'),  -- Coinbase 10
        ('0x77696bb39917c91a0c3908d577d5e322095425ca', 'Exchange'),  -- Coinbase cold
        ('0x503828976d22510aad0201ac7ec88293211d23da', 'Exchange'),  -- Coinbase 2
        ('0xddfabcdc4d8ffc6d5beaf154f18b778f892a0740', 'Exchange'),  -- Coinbase 3
        ('0x3cd751e6b0078be393132286c442345e5dc49699', 'Exchange'),  -- Coinbase 4
        -- Custody/Treasury
        ('0x5a52e96bacdabb82fd05763e25335261b270efcb', 'Custody/Treasury'),  -- BitGo
        ('0x2faf487a4414fe77e2327f0bf4ae2a264a776ad2', 'Custody/Treasury'),  -- FTX (historical)
        ('0xc098b2a3aa256d2140208c3de6543aaef5cd3a94', 'Custody/Treasury'),  -- Fireblocks proxy
        -- Payment Processors
        ('0x70a9f34f9b34c64957b9c401a97bfed35b95049e', 'Payment Processor'),  -- Circle USDC treasury
        ('0x55fe002aeff02f77364de339a1292923a15844b8', 'Payment Processor'),  -- Circle 2
        -- DeFi Protocols
        ('0x7a250d5630b4cf539739df2c5dacb4c659f2488d', 'DeFi Protocol'),  -- Uniswap V2 router
        ('0xe592427a0aece92de3edee1f18e0157c05861564', 'DeFi Protocol'),  -- Uniswap V3 router
        ('0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45', 'DeFi Protocol'),  -- Uniswap universal router
        ('0xdef1c0ded9bec7f1a1670819833240f027b25eff', 'DeFi Protocol'),  -- 0x exchange proxy
        ('0x1111111254eeb25477b68fb85ed929f73a960582', 'DeFi Protocol'),  -- 1inch v5
        ('0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f', 'DeFi Protocol'),  -- Sushiswap router
        ('0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2', 'DeFi Protocol'),  -- Aave V3 pool
        ('0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0', 'DeFi Protocol'),  -- wstETH
        ('0xae7ab96520de3a18e5e111b5eaab095312d7fe84', 'DeFi Protocol'),  -- stETH
        -- Bridges/Wrapped
        ('0x3ee18b2214aff97000d974cf647e7c347e8fa585', 'Bridge/Wrapped'),  -- Wormhole
        ('0x40ec5b33f54e0e8a33a975908c5ba1c14e5bbbdf', 'Bridge/Wrapped'),  -- Polygon bridge
        ('0xa0c68c638235ee32657e8f720a23cec1bfc77c77', 'Bridge/Wrapped'),  -- Polygon bridge 2
        ('0x99c9fc46f92e8a1c0dec1b1747d010903e884be1', 'Bridge/Wrapped'),  -- Optimism bridge
        ('0x4dbd4fc535ac27206064b68ffcf827b0a60bab3f', 'Bridge/Wrapped'),  -- Arbitrum bridge
        ('0x8eb8a3b98659cce290402893d0123abb75e3ab28', 'Bridge/Wrapped')   -- Avalanche bridge
    ) AS t(address, archetype)
),

-- 3. Attach the archetype label to each transfer.
--    LEFT JOIN preserves transfers where the recipient has no label.
--    COALESCE maps NULL (no match) to the literal string 'unknown'.
labeled_transfers AS (
    SELECT
        t.day,
        COALESCE(l.archetype, 'unknown') AS archetype,
        t.amount_usd
    FROM usdc_transfers t
    LEFT JOIN known_labels l
        ON t.recipient = from_hex(substr(l.address, 3))
)

-- 4. Aggregate to daily archetype-level totals.
--    volume_usd: sum of transfer amounts in USD
--    tx_count:   number of individual transfer events
SELECT
    day                                 AS date,
    archetype,
    SUM(amount_usd)                     AS volume_usd,
    COUNT(*)                            AS tx_count,
    approx_percentile(amount_usd, 0.5)  AS median_size,
    approx_percentile(amount_usd, 0.9)  AS pct90_size
FROM labeled_transfers
GROUP BY 1, 2
ORDER BY 1 DESC, 2
