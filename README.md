# GoldIQ - Gold Relative-Value Engine

**Fair comparison of MCX gold contracts, in rupees per gram.**

> Hack in Hills Hackathon 2026 | Team Aurumedge | Sponsors: Web3 India, Builder Base, EXIDO

- **Himanshu Sharnagat** - Dashboard, backtest and research, app design 

---

### The Problem: One Metal, Five Price Formats

MCX has 5 gold contracts with different quoting units, purity and lot sizes. Raw comparison is misleading.

| Contract | Lot | Quoted per | Purity | Tick (Rs/g) |
| :--- | :--- | :--- | :--- | :--- |
| GOLD | 1 kg | 10 g | 995 | 0.100 |
| GOLDM | 100 g | 10 g | 995 | 0.100 |
| GOLDTEN | 10 g | 10 g | 999 | 0.100 |
| GOLDGUINEA | 8 g | 8 g | 999 | 0.125 |
| GOLDPETAL | 1 g | 1 g | 999 | 1.000 |

**Why it matters:**
- **Unit mismatch:** Price per 8g looks cheaper than per 10g even for identical gold.
- **Expiry & purity:** Different months have different cost of carry; 995 vs 999 has a stable basis.
- **Coarse ticks:** A Rs 1 tick on Petal is 10x coarser per gram.
- Jewellers, retail traders and hedgers see fake gaps that are only noise. Wrong 'arbitrage' costs real money.

### Our Approach: 4 Steps from Quote to Signal

**01 Normalise:** Convert every quote to Rs per gram using its quotation base.
`Rs/g = quoted price / quotation base (g)`

**02 Align:** Compare only same symbol, expiry and date. No stitched near-month series. Join key is `(symbol, expiry)`.

**03 Score:** Hedged spread in basis points, then rolling z-score on past data only.
`Spread (bps) = ln(pure price A / carry-adjusted pure price B) * 10,000`

**04 Gate:** Signal only if gap beats fees, slippage, tick size and liquidity limits. Hedge ratio is rounded to whole lots. 995 vs 999 purity basis is modelled and removed.

### How GoldIQ Works

`1. Upload MCX Bhavcopy CSV/Excel` -> `2. Validate (schema, duplicates, dates, stale closes)` -> `3. Normalise to Rs/g` -> `4. Align + Score (same expiry, hedged spread, z-score)` -> `5. Cost Gate (must beat fees)` -> `6. Decide`

**THREE OUTCOMES:**
- **Active signal:** Gap clears every gate. Shown with reason and risks.
- **Watch:** Gap is real but history, liquidity or expiry window not ready.
- **No trade:** Gap sits inside costs. Quiet by design: no alert noise. This is a valid result.

> Example: GOLDM Rs 14,185/g vs GOLDTEN Rs 14,190/g -> Raw gap 3.5 bps. Cost gate 8.0 bps -> 3.5 < 8.0 = NO TRADE

### Prototype Features

**Six-tab Dashboard:**
1. Executive Overview - Pure gold price per gram, expiry, days to expiry, lot value, volume, OI, gap vs mean (bps)
2. Relative Value Explorer
3. Futures Curve
4. Backtesting Lab - Walk-forward backtest
5. Contract Intelligence - Expiry calendar, MCX settlement-window compliance, liquidity & turnover profile
6. Data Center - Upload, schema check and audit report

**Data Quality Engine:**
- Automated checks: schema, duplicates, date format, missing days, stale closes, outliers
- Liquidity and lifecycle rules decide when a contract may be traded

### GoldIQ vs Raw Quotes

| What a trader needs | Raw quotes | GoldIQ |
| :--- | :--- | :--- |
| Same unit | 8g and 10g prices look different | Everything in Rs per gram |
| Same expiry | Near-month series mixes months | Join on (symbol, expiry) |
| Purity basis | 995 vs 999 ignored | Modelled and removed |
| Costs | Gap looks like profit | Cost gate before any signal |
| Explainability | Just a number | Reason, checklist and risks shown |
| Data quality | Unchecked files | Automated audit report |

### Roadmap and Honest Limits

**Phase 1: Hackathon MVP**
- Five-contract normalisation
- Spread and z-score engine
- Six-tab dashboard on Bhavcopy data
- Walk-forward backtest lab

**Phase 2: Live monitoring**
- Daily data refresh, Telegram/email alerts, Gross vs net report, Multi-month history

**Phase 3: Production**
- Intraday data, broker-aware lot sizing, monitoring and audit trail

**Known limits:** Thin liquidity, short samples, regime shifts and stale closes can break a signal. Demo uses a small sample, more history is next step.

### How to Run

```bash
pip install -r requirements.txt
streamlit run app.py
# Upload MCX Bhavcopy CSV from: https://www.mcxindia.com/market-data/bhavcopy
