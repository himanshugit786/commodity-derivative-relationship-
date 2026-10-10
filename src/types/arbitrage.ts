export interface TenorContract {
  code: string; // e.g. "AUG24", "OCT24", "DEC24", "FEB25"
  name: string; // e.g. "M24 (Aug)", "V24 (Oct)"
  month: string;
  year: number;
  price: number; // e.g. 71840
  fairValue: number; // e.g. 71840, 72482, 73120
  openInterest: number; // in lots
  volume: number;
  expiryDate: string;
  daysToExpiry: number;
  impliedYield: number; // % p.a.
  tenderCutoffDate: string;
  tickDirection?: 'up' | 'down';
}

export interface CalendarPair {
  id: string; // e.g. "OCT24-DEC24"
  nearLeg: string; // "OCT24"
  farLeg: string; // "DEC24"
  nearPrice: number;
  farPrice: number;
  grossSpread: number; // e.g. 770
  grossSpreadBps: number; // e.g. 107 bps
  carryExpense: number; // e.g. 610
  carryExpenseAnnRate: number; // e.g. 6.75%
  netArbEdge: number; // e.g. 160
  lotValueEdge: number; // e.g. 16000
  zScore: number; // e.g. +2.38
  zScoreLabel: string; // "SELL SPREAD"
  badge: string; // "RICH BASIS (+160)", "FAIR PRICED", "4-MONTH CURVE", "DISCOUNT BASIS"
  badgeType: 'rich' | 'fair' | 'watchlist' | 'discount';
  liquidityTier: 'Tier-1' | 'High Roll' | 'Moderate' | 'Low Open';
  liquidityBars: number; // 1 to 4
  impliedBorrowRate: number; // 8.42% p.a.
  impliedBorrowSpreadBps: number; // +167 bps
  tenorMonths: number;
  holdingDays: number;
  tickDirection?: 'up' | 'down';
}

export interface OmsPrint {
  id: string;
  timestamp: string;
  instrument: string;
  direction: 'BUY' | 'SELL';
  lots: number;
  spread: number;
  status: 'MATCHED' | 'ROUTED' | 'FILLED';
}

export interface CostModelParams {
  spotPrice: number; // 71840
  miborRate: number; // 6.75 (%)
  deskBorrowSpreadBps: number; // 42 (bps)
  vaultStoragePer100gPerDay: number; // 3.50 (INR)
  transitInsurancePct: number; // 0.03 (%)
  turnoverFeePct: number; // 0.0026 (%)
  gstRatePct: number; // 3.0 (%)
  assayingFeePerLot: number; // 150 (INR)
}

export interface OpenSpreadPosition {
  id: string;
  pairId: string;
  direction: 'SELL_SPREAD' | 'BUY_SPREAD'; // SELL_SPREAD = Short Near / Long Far or vice versa based on arb
  nearLeg: string;
  farLeg: string;
  nearEntryPrice: number;
  farEntryPrice: number;
  entrySpread: number;
  currentSpread: number;
  lots: number;
  lotSizeKg: number; // 1kg = 1000g (100 units of 10g)
  unrealizedPnl: number;
  marginUsed: number;
  zScoreAtEntry: number;
  currentZScore: number;
  openDate: string;
  daysToTender: number;
}

export interface MarketAlert {
  id: string;
  type: 'divergence' | 'tender' | 'macro' | 'vault';
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  severity: 'critical' | 'warning' | 'info';
}
