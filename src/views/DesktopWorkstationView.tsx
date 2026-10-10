import React, { useState } from 'react';
import { CalendarPair, CostModelParams, OpenSpreadPosition, TenorContract } from '../types/arbitrage';

interface DesktopWorkstationViewProps {
  tenors: TenorContract[];
  pairs: CalendarPair[];
  selectedPair: CalendarPair;
  positions: OpenSpreadPosition[];
  costParams: CostModelParams;
  omsPrints?: import('../types/arbitrage').OmsPrint[];
  spotPrice?: number;
  onSelectPair: (pair: CalendarPair) => void;
  onOpenExecution: (direction: 'BUY_SPREAD' | 'SELL_SPREAD') => void;
  onOpenVaultModal: () => void;
  onSquareOff: (positionId: string) => void;
  onRollPosition: (positionId: string) => void;
  onExecuteTrade: (position: Omit<OpenSpreadPosition, 'id' | 'openDate'>) => void;
}

export const DesktopWorkstationView: React.FC<DesktopWorkstationViewProps> = ({
  tenors,
  pairs,
  selectedPair,
  positions,
  costParams: initialCostParams,
  omsPrints = [],
  spotPrice = 71840,
  onSelectPair,
  onOpenExecution,
  onOpenVaultModal,
  onSquareOff,
  onRollPosition,
  onExecuteTrade,
}) => {
  // Chart toggle
  const [chartMode, setChartMode] = useState<'PRICE' | 'IMPLIED'>('PRICE');
  const [selectedNodeModal, setSelectedNodeModal] = useState<TenorContract | null>(null);

  // Macro rate shift simulator
  const [rateShockBps, setRateShockBps] = useState<number>(0);

  // Bottom dock active tab
  const [dockTab, setDockTab] = useState<'POSITIONS' | 'COST_MODEL' | 'Z_CHANNEL' | 'AUDIT_TAPE'>('POSITIONS');

  // Inline fast order entry state
  const [dockLots, setDockLots] = useState<number>(5);
  const [dockOrderType, setDockOrderType] = useState<'LIMIT' | 'MARKET' | 'IOC'>('LIMIT');
  const [selectedSpreadPrice, setSelectedSpreadPrice] = useState<number>(selectedPair.grossSpread);
  const [orderExecuting, setOrderExecuting] = useState<boolean>(false);
  const [lastExecutedOrder, setLastExecutedOrder] = useState<string | null>(null);

  // Cost model interactive parameters in bottom dock
  const [costParams, setCostParams] = useState<CostModelParams>(initialCostParams);

  // Interactive sorting for pairs
  const [sortBy, setSortBy] = useState<'default' | 'zscore' | 'edge' | 'liquidity'>('default');

  const sortedPairs = [...pairs].sort((a, b) => {
    if (sortBy === 'zscore') return Math.abs(b.zScore) - Math.abs(a.zScore);
    if (sortBy === 'edge') return b.netArbEdge - a.netArbEdge;
    if (sortBy === 'liquidity') return b.liquidityBars - a.liquidityBars;
    return 0;
  });

  // Rates math
  const baselineMibor = 6.75;
  const simulatedMibor = baselineMibor + rateShockBps / 100;
  const theoDeltaGap = Math.round((rateShockBps / 50) * 45);
  const simulatedTheoCarry = selectedPair.carryExpense + theoDeltaGap;
  const simulatedNetEdge = selectedPair.grossSpread - simulatedTheoCarry;

  // Portfolio total P&L
  const totalPnl = positions.reduce((acc, p) => acc + p.unrealizedPnl, 0);
  const totalMarginUsed = positions.reduce((acc, p) => acc + p.marginUsed, 0);

  // Synthetic Spread Depth ladder for selected pair
  const spreadBids = [
    { spread: selectedPair.grossSpread - 1, lots: 18, totalLots: 18 },
    { spread: selectedPair.grossSpread - 2, lots: 34, totalLots: 52 },
    { spread: selectedPair.grossSpread - 3, lots: 65, totalLots: 117 },
  ];

  const spreadAsks = [
    { spread: selectedPair.grossSpread + 1, lots: 22, totalLots: 22 },
    { spread: selectedPair.grossSpread + 2, lots: 48, totalLots: 70 },
    { spread: selectedPair.grossSpread + 3, lots: 75, totalLots: 145 },
  ];

  // Dynamic SVG Y positions based on rate shock
  // Baseline Theo: Aug: 158, Oct: 118, Dec: 88, Feb: 48
  // Rate hike increases theoretical cost (higher fair forward price -> lower Y in SVG)
  const theoDecY = 88 - (rateShockBps / 50) * 12;
  const theoOctY = 118 - (rateShockBps / 50) * 6;
  const theoFebY = 48 - (rateShockBps / 50) * 16;

  // Selected pair coordinates for the SVG highlight
  const getPairXCoords = (pairId: string) => {
    switch (pairId) {
      case 'AUG24-OCT24':
        return { x1: 50, x2: 190, y1: 158, y2: 110, theoY2: theoOctY };
      case 'OCT24-DEC24':
        return { x1: 190, x2: 350, y1: 110, y2: 60, theoY2: theoDecY };
      case 'DEC24-FEB25':
        return { x1: 350, x2: 490, y1: 60, y2: 28, theoY2: theoFebY };
      case 'AUG24-DEC24':
      default:
        return { x1: 50, x2: 350, y1: 158, y2: 60, theoY2: theoDecY };
    }
  };

  const pairCoords = getPairXCoords(selectedPair.id);

  // Fast direct execution handler
  const handleFastOrder = (direction: 'BUY_SPREAD' | 'SELL_SPREAD') => {
    setOrderExecuting(true);
    const marginPerLot = 340000;

    setTimeout(() => {
      setOrderExecuting(false);
      const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
      setLastExecutedOrder(`Fill: ${dockLots} Lots @ +₹${selectedPair.grossSpread} [${direction === 'SELL_SPREAD' ? 'SHORT ARB' : 'LONG ARB'}] - ${orderId}`);

      onExecuteTrade({
        pairId: selectedPair.id,
        direction,
        nearLeg: selectedPair.nearLeg,
        farLeg: selectedPair.farLeg,
        nearEntryPrice: selectedPair.nearPrice,
        farEntryPrice: selectedPair.farPrice,
        entrySpread: selectedPair.grossSpread,
        currentSpread: selectedPair.grossSpread,
        lots: dockLots,
        lotSizeKg: 1,
        unrealizedPnl: 0,
        marginUsed: marginPerLot * dockLots,
        zScoreAtEntry: selectedPair.zScore,
        currentZScore: selectedPair.zScore,
        daysToTender: selectedPair.holdingDays,
      });

      setTimeout(() => {
        setLastExecutedOrder(null);
      }, 4000);
    }, 450);
  };

  return (
    <div className="w-full flex-1 flex flex-col px-3 lg:px-6 py-3 gap-3 bg-[#111319] text-[#e1e2ea]">
      {/* Real-time Order Fill Toast */}
      {lastExecutedOrder && (
        <div className="fixed top-16 right-6 z-50 bg-[#1d2025] border border-[#4edea3] text-[#4edea3] px-4 py-2.5 rounded-lg shadow-2xl text-xs font-mono font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top duration-150">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span>{lastExecutedOrder}</span>
        </div>
      )}

      {/* Institutional Top Workstation KPI Bar (5 Cards across 100% width) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
        <div className="bg-[#1d2025] p-2.5 rounded-lg border border-[#272a30] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#9b8f7f]">
            <span className="text-label-mono-micro uppercase">Max Forward Slope</span>
            <span className="material-symbols-outlined text-[15px] text-[#ffd58d]">trending_up</span>
          </div>
          <div className="mt-1">
            <div className="text-label-numeric-lg text-[#ffd58d] font-bold">
              ₹770<span className="text-label-numeric-sm font-normal text-[#d2c5b3]">/10g</span>
            </div>
            <span className="text-label-mono-micro text-[#4edea3] font-bold">OCT-DEC NODE (+107 bps)</span>
          </div>
        </div>

        <div className="bg-[#1d2025] p-2.5 rounded-lg border border-[#272a30] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#9b8f7f]">
            <span className="text-label-mono-micro uppercase">Annualized Carry</span>
            <span className="material-symbols-outlined text-[15px] text-[#7bd0ff]">percent</span>
          </div>
          <div className="mt-1">
            <div className="text-label-numeric-lg text-[#c4e7ff] font-bold">7.18% p.a.</div>
            <span className="text-label-mono-micro text-[#b2e1ff] font-medium">+43bps vs Repo Hurdle</span>
          </div>
        </div>

        <div className="bg-[#1d2025] p-2.5 rounded-lg border border-[#272a30] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#9b8f7f]">
            <span className="text-label-mono-micro uppercase">Peak Arb Z-Score</span>
            <span className="material-symbols-outlined text-[15px] text-[#6ffbbe]">crisis_alert</span>
          </div>
          <div className="mt-1">
            <div className="text-label-numeric-lg text-[#6ffbbe] font-bold">+2.38σ</div>
            <span className="text-label-mono-micro text-[#ffdea9] uppercase font-bold">SELL SPREAD (SHORT ARB)</span>
          </div>
        </div>

        <div
          onClick={onOpenVaultModal}
          className="bg-[#1d2025] p-2.5 rounded-lg border border-[#272a30] hover:border-[#7bd0ff]/40 transition-colors cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-[#9b8f7f]">
            <span className="text-label-mono-micro uppercase">Ahmedabad Demat Stock</span>
            <span className="material-symbols-outlined text-[15px] text-[#b2e1ff]">inventory_2</span>
          </div>
          <div className="mt-1">
            <div className="text-label-numeric-lg text-[#e1e2ea] font-bold">4,120 kg</div>
            <span className="text-label-mono-micro text-[#4edea3] font-bold">142% Adequate Delivery Cover</span>
          </div>
        </div>

        <div className="bg-[#1d2025] p-2.5 rounded-lg border border-[#272a30] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#9b8f7f]">
            <span className="text-label-mono-micro uppercase">Portfolio Desk MTM</span>
            <span className="material-symbols-outlined text-[15px] text-[#4edea3]">account_balance_wallet</span>
          </div>
          <div className="mt-1">
            <div className={`text-label-numeric-lg font-bold ${totalPnl >= 0 ? 'text-[#4edea3]' : 'text-[#ffb4ab]'}`}>
              {totalPnl >= 0 ? `+₹${totalPnl.toLocaleString('en-IN')}` : `-₹${Math.abs(totalPnl).toLocaleString('en-IN')}`}
            </div>
            <span className="text-label-mono-micro text-[#ffd58d]">
              Margin: ₹{(totalMarginUsed / 100000).toFixed(1)}L / ₹65.0L (74%)
            </span>
          </div>
        </div>
      </div>

      {/* Main Dual-Column Trading Canvas (Desktop 60% / 40% Split) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        {/* LEFT COLUMN: Forward Curve + Macro Simulator + Tender Milestones (7 Columns) */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          {/* Main Forward Curve Term Structure Canvas */}
          <div className="bg-[#191c21] rounded-xl p-3.5 border border-[#272a30] shadow-xl">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ffd58d] text-[20px]">show_chart</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-headline-sm text-[#e1e2ea] font-bold tracking-tight">
                      MCX Gold Forward Term Structure
                    </h2>
                    <span className="px-1.5 py-0.5 rounded bg-[#e5b869]/20 text-[#ffd58d] text-label-mono-micro font-bold">
                      ACTIVE: {selectedPair.id} (+₹{selectedPair.netArbEdge} EDGE)
                    </span>
                  </div>
                  <span className="text-body-sm text-[#9b8f7f]">
                    Contracts: M24 (Aug), V24 (Oct), Z24 (Dec), G25 (Feb) | Click any point to inspect
                  </span>
                </div>
              </div>

              {/* View Toggle */}
              <div className="flex items-center bg-[#32353b] p-0.5 rounded">
                <button
                  onClick={() => setChartMode('PRICE')}
                  className={`px-3 py-1 rounded text-label-mono-micro font-semibold transition-all cursor-pointer ${
                    chartMode === 'PRICE'
                      ? 'bg-[#e5b869] text-[#674800]'
                      : 'text-[#d2c5b3] hover:text-[#e1e2ea]'
                  }`}
                >
                  PRICE (₹/10g)
                </button>
                <button
                  onClick={() => setChartMode('IMPLIED')}
                  className={`px-3 py-1 rounded text-label-mono-micro font-semibold transition-all cursor-pointer ${
                    chartMode === 'IMPLIED'
                      ? 'bg-[#e5b869] text-[#674800]'
                      : 'text-[#d2c5b3] hover:text-[#e1e2ea]'
                  }`}
                >
                  IMPLIED YIELD (% p.a.)
                </button>
              </div>
            </div>

            {/* High-Resolution SVG Chart */}
            <div className="relative w-full h-64 bg-[#0b0e13] rounded-lg overflow-hidden p-3 border border-[#1d2025]">
              {/* Grid Lines */}
              <div className="absolute inset-x-3 top-3 bottom-7 flex flex-col justify-between pointer-events-none opacity-25">
                <div className="w-full h-px bg-[#4e4538]"></div>
                <div className="w-full h-px bg-[#4e4538]"></div>
                <div className="w-full h-px bg-[#4e4538]"></div>
                <div className="w-full h-px bg-[#4e4538]"></div>
              </div>

              {chartMode === 'PRICE' ? (
                <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 540 200">
                  <defs>
                    <linearGradient id="desktopCyanSpreadGlow" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#7bd0ff" stopOpacity="0.32" />
                      <stop offset="100%" stopColor="#7bd0ff" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Arbitrage Gap Shaded Zone for Currently Selected Pair */}
                  <polygon
                    fill="rgba(237, 191, 112, 0.28)"
                    points={`${pairCoords.x1},${pairCoords.y1} ${pairCoords.x2},${pairCoords.y2} ${pairCoords.x2},${pairCoords.theoY2} ${pairCoords.x1},${pairCoords.y1}`}
                  />

                  {/* Curve Fill */}
                  <path
                    d="M 50,158 L 190,110 L 350,60 L 490,28 L 490,190 L 50,190 Z"
                    fill="url(#desktopCyanSpreadGlow)"
                  />

                  {/* Theoretical Fair Value Curve (Dashed Gold) - Responds to Rate Shock */}
                  <path
                    d={`M 50,158 L 190,${theoOctY} L 350,${theoDecY} L 490,${theoFebY}`}
                    fill="none"
                    stroke="#edbf70"
                    strokeDasharray="5,5"
                    strokeWidth="2.5"
                  />

                  {/* Market Spot/Futures Price Curve (Cyan Solid) */}
                  <path
                    d="M 50,158 L 190,110 L 350,60 L 490,28"
                    fill="none"
                    stroke="#7bd0ff"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3.5"
                  />

                  {/* Delta Callout Vertical Marker at Far Leg */}
                  <line
                    stroke="#ffd58d"
                    strokeWidth="2"
                    x1={pairCoords.x2}
                    x2={pairCoords.x2}
                    y1={pairCoords.y2}
                    y2={pairCoords.theoY2}
                  />
                  <circle cx={pairCoords.x2} cy={pairCoords.y2} fill="#7bd0ff" r="5" className="cursor-pointer" />
                  <circle cx={pairCoords.x2} cy={pairCoords.theoY2} fill="#edbf70" r="4.5" className="cursor-pointer" />

                  {/* Market Data Points */}
                  {tenors.map((t, idx) => {
                    const cx = idx === 0 ? 50 : idx === 1 ? 190 : idx === 2 ? 350 : 490;
                    const cy = idx === 0 ? 158 : idx === 1 ? 110 : idx === 2 ? 60 : 28;
                    return (
                      <circle
                        key={t.code}
                        cx={cx}
                        cy={cy}
                        fill="#7bd0ff"
                        r="5"
                        className="cursor-pointer hover:r-7 transition-all"
                        onClick={() => setSelectedNodeModal(t)}
                      />
                    );
                  })}

                  {/* Rich Anomaly Callout Tooltip Badge */}
                  <g
                    transform={`translate(${pairCoords.x2 - 105}, 18)`}
                    className="cursor-pointer"
                    onClick={() => {
                      const dec = tenors.find((t) => t.code === 'DEC24');
                      if (dec) setSelectedNodeModal(dec);
                    }}
                  >
                    <rect fill="#191c21" height="26" rx="4" stroke="#edbf70" strokeWidth="1" width="125" />
                    <text fill="#ffd58d" fontFamily="JetBrains Mono" fontSize="9.5" fontWeight="700" x="8" y="17">
                      +₹{selectedPair.netArbEdge} {selectedPair.netArbEdge > 0 ? 'RICH' : 'DRAG'}
                    </text>
                    <text fill="#4edea3" fontFamily="JetBrains Mono" fontSize="9.5" fontWeight="700" x="86" y="17">
                      {selectedPair.zScore > 0 ? `+${selectedPair.zScore}σ` : `${selectedPair.zScore}σ`}
                    </text>
                  </g>
                </svg>
              ) : (
                /* Implied Yield Mode SVG */
                <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 540 200">
                  <line stroke="#9b8f7f" strokeWidth="1.5" strokeDasharray="4,4" x1="40" x2="500" y1="120" y2="120" />
                  <text fill="#9b8f7f" fontSize="10" fontFamily="JetBrains Mono" x="45" y="112">
                    MIBOR REPO HURDLE: {simulatedMibor.toFixed(2)}%
                  </text>

                  <path d="M 50,135 L 190,102 L 350,42 L 490,95" fill="none" stroke="#4edea3" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="50" cy="135" fill="#4edea3" r="5" />
                  <circle cx="190" cy="102" fill="#4edea3" r="5" />
                  <circle cx="350" cy="42" fill="#ffd58d" r="6" />
                  <circle cx="490" cy="95" fill="#4edea3" r="5" />

                  <g transform="translate(280, 15)">
                    <rect fill="#191c21" height="24" rx="3" stroke="#4edea3" strokeWidth="0.8" width="140" />
                    <text fill="#ffd58d" fontFamily="JetBrains Mono" fontSize="9.5" fontWeight="700" x="8" y="16">
                      DEC YIELD: 8.42% (+167bps)
                    </text>
                  </g>
                </svg>
              )}

              {/* Dynamic Bottom Axis Labels with Quotations */}
              <div className="absolute bottom-1 inset-x-3 flex justify-between px-4 text-[#9b8f7f] text-label-mono-micro">
                {tenors.map((t) => (
                  <div
                    key={t.code}
                    className="flex flex-col items-center cursor-pointer hover:text-white transition-colors"
                    onClick={() => setSelectedNodeModal(t)}
                  >
                    <span className="text-[#e1e2ea] font-bold text-xs">{t.code}</span>
                    <span className="text-[#edbf70] font-mono text-[11px]">
                      {chartMode === 'PRICE' ? `₹${t.price.toLocaleString('en-IN')}` : `${t.impliedYield}% p.a.`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Contract Modal / Node Inspector Drawer if clicked */}
            {selectedNodeModal && (
              <div className="mt-2.5 p-3 bg-[#0b0e13] rounded-lg border border-[#ffd58d]/50 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#4edea3]"></span>
                    <span className="text-[#ffd58d] font-bold text-sm">{selectedNodeModal.name}</span>
                  </div>
                  <span className="text-[#d2c5b3]">
                    Market: <strong>₹{selectedNodeModal.price.toLocaleString('en-IN')}</strong> | Theo: ₹
                    {selectedNodeModal.fairValue.toLocaleString('en-IN')} | Days to Expiry: {selectedNodeModal.daysToExpiry}D | Tender Cut: {selectedNodeModal.tenderCutoffDate}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedNodeModal(null)}
                  className="px-2 py-0.5 rounded bg-[#272a30] text-[#9b8f7f] hover:text-white"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Legend & Anomaly Descriptor */}
            <div className="mt-2.5 pt-2 flex items-center justify-between text-[#9b8f7f] text-label-numeric-sm border-t border-[#272a30]">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-1 bg-[#7bd0ff] rounded-full"></span>
                  <span className="text-[#d2c5b3] font-mono text-xs">MCX Market Forward Curve</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-1 bg-[#edbf70] rounded-full border-b border-dashed"></span>
                  <span className="text-[#d2c5b3] font-mono text-xs">Theoretical Cost-of-Carry (Fair)</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-[#ffd58d]">
                <span className="material-symbols-outlined text-[15px]">lightbulb</span>
                <span className="text-body-sm font-semibold">
                  Oct-Dec Gross Gap +₹770 vs Theo Fair Carry +₹610
                </span>
              </div>
            </div>
          </div>

          {/* Macro Rate Shift Simulator (Interactive Scenario Engine) */}
          <div className="bg-[#272a30] rounded-xl p-3 border border-[#32353b] shadow-lg">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ffd58d] text-[18px]">tune</span>
                <h3 className="text-headline-sm text-[#ffd58d] font-bold">Macro Rate Shift Simulator</h3>
              </div>
              <span className="text-label-mono-micro text-[#d2c5b3] font-mono">DELTA SCENARIO TEST</span>
            </div>
            <p className="text-body-sm text-[#d2c5b3] mb-2.5">
              Simulate RBI repo and interbank MIBOR interest rate shocks across forward contango carry slopes.
            </p>

            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => setRateShockBps(-50)}
                className={`py-2 px-2.5 rounded text-label-mono-micro font-semibold transition-all text-center border cursor-pointer ${
                  rateShockBps === -50
                    ? 'bg-[#1d2025] border-[#4edea3] text-white shadow-md'
                    : 'bg-[#1d2025] border-[#32353b] text-[#e1e2ea] hover:bg-[#32353b]'
                }`}
              >
                -50bps RATE CUT
                <br />
                <span className="text-[#4edea3] font-mono font-bold">Theo Gap -₹45</span>
              </button>

              <button
                onClick={() => setRateShockBps(50)}
                className={`py-2 px-2.5 rounded text-label-mono-micro font-bold transition-all text-center border cursor-pointer ${
                  rateShockBps === 50
                    ? 'bg-[#e5b869] text-[#674800] border-[#ffd58d] shadow-md'
                    : 'bg-[#e5b869]/80 text-[#674800] border-transparent hover:bg-[#e5b869]'
                }`}
              >
                +50bps RATE HIKE
                <br />
                <span className="text-[#674800] font-mono font-bold">Theo Gap +₹45</span>
              </button>

              <button
                onClick={() => setRateShockBps(100)}
                className={`py-2 px-2.5 rounded text-label-mono-micro font-bold transition-all text-center border cursor-pointer ${
                  rateShockBps === 100
                    ? 'bg-[#e5b869] text-[#674800] border-[#ffd58d] shadow-md'
                    : 'bg-[#1d2025] border-[#32353b] text-[#e1e2ea] hover:bg-[#32353b]'
                }`}
              >
                +100bps SHOCK
                <br />
                <span className="text-[#ffd58d] font-mono font-bold">Theo Gap +₹90</span>
              </button>

              <button
                onClick={() => setRateShockBps(0)}
                className="py-2 px-2.5 rounded bg-[#1d2025] border border-[#32353b] hover:bg-[#32353b] text-[#9b8f7f] hover:text-white text-label-mono-micro font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                Reset Baseline
              </button>
            </div>

            {/* Rate Slider for Precise Shocks */}
            <div className="mt-2.5 pt-2 border-t border-[#32353b] flex items-center gap-3">
              <span className="text-xs font-mono text-[#9b8f7f] whitespace-nowrap">Fine Shock Dial:</span>
              <input
                type="range"
                min="-150"
                max="150"
                step="10"
                value={rateShockBps}
                onChange={(e) => setRateShockBps(parseInt(e.target.value))}
                className="flex-1 accent-[#ffd58d] h-1.5 bg-[#1d2025] rounded cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-[#ffd58d] w-16 text-right">
                {rateShockBps > 0 ? `+${rateShockBps}` : rateShockBps} bps
              </span>
            </div>

            {/* Simulation Impact Result */}
            <div className="mt-2.5 p-2 rounded bg-[#0b0e13] flex items-center justify-between border border-[#1d2025]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-[#4edea3]">insights</span>
                <span className="text-body-sm text-[#e1e2ea]">
                  {rateShockBps === 0 ? (
                    <>
                      Baseline MIBOR: <strong className="font-mono">6.75%</strong> (+42bps spread)
                    </>
                  ) : (
                    <>
                      Simulated Interbank Rate:{' '}
                      <strong className={`font-mono ${rateShockBps > 0 ? 'text-[#ffd58d]' : 'text-[#4edea3]'}`}>
                        {simulatedMibor.toFixed(2)}% ({rateShockBps > 0 ? `+${rateShockBps}` : rateShockBps}bps)
                      </strong>
                    </>
                  )}
                </span>
              </div>
              <span className="text-label-numeric-sm font-bold text-[#4edea3]">
                {rateShockBps === 0
                  ? `OCT-DEC ARB: +₹${selectedPair.netArbEdge}`
                  : rateShockBps > 0
                  ? `OCT-DEC ARB: +₹${simulatedNetEdge} (Narrowing)`
                  : `OCT-DEC ARB: +₹${simulatedNetEdge} (Widening)`}
              </span>
            </div>
          </div>

          {/* Roll Risk & Physical Delivery Milestones */}
          <div className="bg-[#191c21] rounded-xl p-3 border border-[#272a30]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ffd58d] text-[18px]">event_repeat</span>
                <h3 className="text-headline-sm text-[#e1e2ea] font-bold">Roll Risk &amp; Tender Milestones</h3>
              </div>
              <span className="text-label-mono-micro text-[#d2c5b3] font-mono">LOT: 1 KG (1000g)</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center my-2">
              <div className="bg-[#1d2025] p-2.5 rounded border border-[#272a30]">
                <span className="text-label-mono-micro text-[#4edea3] block font-bold">T-5 TRADING DAYS</span>
                <span className="text-headline-sm text-[#e1e2ea] font-bold">AUG ROLL</span>
                <span className="text-body-sm text-[#9b8f7f] block">Roll Efficiency 98.4%</span>
              </div>
              <div className="bg-[#1d2025] p-2.5 rounded border border-[#272a30]">
                <span className="text-label-mono-micro text-[#ffd58d] block font-bold">26 JUL 2024</span>
                <span className="text-headline-sm text-[#e1e2ea] font-bold">TENDER CUT</span>
                <span className="text-body-sm text-[#9b8f7f] block">Compulsory Delivery</span>
              </div>
              <div className="bg-[#1d2025] p-2.5 rounded border border-[#272a30]">
                <span className="text-label-mono-micro text-[#ffb4ab] block font-bold">05 AUG 2024</span>
                <span className="text-headline-sm text-[#e1e2ea] font-bold">FINAL EXPIRY</span>
                <span className="text-body-sm text-[#9b8f7f] block">Warehouse Settlement</span>
              </div>
            </div>

            <div
              onClick={onOpenVaultModal}
              className="flex items-center justify-between pt-2 text-[#d2c5b3] text-body-sm hover:bg-[#272a30]/50 p-1.5 rounded cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#b2e1ff]">inventory_2</span>
                <span>
                  Ahmedabad Vault Demat Stock: <strong className="text-[#e1e2ea] font-mono">4,120 kg</strong>
                </span>
              </div>
              <span className="text-[#4edea3] font-mono text-xs font-semibold">Adequate Cover →</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Calendar Pair Matrix + L2 Spread Depth + Execution Dock (5 Columns) */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          {/* Calendar Pair Matrix Panel */}
          <div className="bg-[#191c21] rounded-xl p-3 border border-[#272a30] shadow-xl">
            <div className="flex items-center justify-between mb-2 pb-1 border-b border-[#272a30]">
              <div className="flex items-center gap-2">
                <h3 className="text-headline-sm text-[#e1e2ea] font-bold">Calendar Pair Matrix</h3>
                <span className="text-label-mono-micro px-1.5 py-0.5 rounded bg-[#272a30] text-[#d2c5b3]">
                  {pairs.length} MONITORED
                </span>
              </div>
              <button
                onClick={() =>
                  setSortBy(
                    sortBy === 'default'
                      ? 'zscore'
                      : sortBy === 'zscore'
                      ? 'edge'
                      : sortBy === 'edge'
                      ? 'liquidity'
                      : 'default'
                  )
                }
                className="text-label-mono-micro text-[#ffd58d] hover:underline font-bold font-mono cursor-pointer"
              >
                AUTO-RANK {sortBy !== 'default' && `(${sortBy.toUpperCase()})`}
              </button>
            </div>

            <div className="space-y-2">
              {sortedPairs.map((pair) => {
                const isSelected = selectedPair.id === pair.id;
                const isTopArb = pair.id === 'OCT24-DEC24';

                return (
                  <div
                    key={pair.id}
                    onClick={() => {
                      onSelectPair(pair);
                      setSelectedSpreadPrice(pair.grossSpread);
                    }}
                    className={`bg-[#1d2025] rounded-lg p-2.5 transition-all cursor-pointer border ${
                      isSelected
                        ? 'border-[#ffd58d] ring-1 ring-[#ffd58d]/40 shadow-lg'
                        : isTopArb
                        ? 'border-[#4edea3]/40'
                        : 'border-[#272a30] hover:border-[#32353b]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-headline-sm text-[#e1e2ea] font-bold">
                          {pair.nearLeg} - {pair.farLeg}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                            pair.badgeType === 'rich'
                              ? 'bg-[#00a572]/20 text-[#4edea3]'
                              : pair.badgeType === 'watchlist'
                              ? 'bg-[#272a30] text-[#ffd58d]'
                              : pair.badgeType === 'discount'
                              ? 'bg-[#93000a]/20 text-[#ffb4ab]'
                              : 'bg-[#272a30] text-[#d2c5b3]'
                          }`}
                        >
                          {pair.badge}
                        </span>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-label-numeric-md font-bold ${
                            pair.zScore > 2 ? 'text-[#6ffbbe]' : pair.zScore > 0 ? 'text-[#ffd58d]' : 'text-[#e1e2ea]'
                          }`}
                        >
                          {pair.zScore > 0 ? `+${pair.zScore}σ` : `${pair.zScore}σ`}
                        </span>
                        <span className="block text-[10px] font-mono font-semibold text-[#9b8f7f] uppercase">
                          {pair.zScoreLabel}
                        </span>
                      </div>
                    </div>

                    {/* Metrics 4-Col Grid */}
                    <div className="grid grid-cols-4 gap-1.5 bg-[#0b0e13]/60 p-2 rounded text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-[#9b8f7f] block">GROSS</span>
                        <span className="text-[#ffd58d] font-bold">+₹{pair.grossSpread}</span>
                        <span className="text-[10px] text-[#9b8f7f] block">{pair.grossSpreadBps}bps</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#9b8f7f] block">CARRY</span>
                        <span className="text-[#e1e2ea]">₹{pair.carryExpense}</span>
                        <span className="text-[10px] text-[#9b8f7f] block">{pair.carryExpenseAnnRate}%</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#9b8f7f] block">NET EDGE</span>
                        <span className={`font-bold ${pair.netArbEdge > 0 ? 'text-[#4edea3]' : 'text-[#ffb4ab]'}`}>
                          {pair.netArbEdge > 0 ? `+₹${pair.netArbEdge}` : `-₹${Math.abs(pair.netArbEdge)}`}
                        </span>
                        <span className="text-[10px] text-[#4edea3] block">
                          ₹{pair.lotValueEdge.toLocaleString('en-IN')}/L
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-[#9b8f7f] block">LIQUIDITY</span>
                        <div className="flex items-center justify-end gap-0.5 mt-0.5">
                          {[1, 2, 3, 4].map((b) => (
                            <span
                              key={b}
                              className={`w-1.5 h-2.5 rounded-[1px] ${
                                b <= pair.liquidityBars ? 'bg-[#4edea3]' : 'bg-[#36393f]'
                              }`}
                            ></span>
                          ))}
                        </div>
                        <span className="text-[10px] text-[#d2c5b3]">{pair.liquidityTier}</span>
                      </div>
                    </div>

                    {/* Action */}
                    {isTopArb && (
                      <div className="mt-2 flex items-center justify-between pt-1">
                        <span className="text-[11px] text-[#9b8f7f]">
                          Implied Borrow: <strong className="text-[#e1e2ea] font-mono">{pair.impliedBorrowRate}%</strong>
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenExecution('SELL_SPREAD');
                          }}
                          className="px-2.5 py-1 rounded bg-[#4edea3] hover:bg-[#6ffbbe] text-[#003824] font-mono text-[11px] font-bold uppercase transition-all shadow-sm cursor-pointer"
                        >
                          Route Short Arb
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Synthetic Spread L2 Depth & Fast Execution Dock */}
          <div className="bg-[#191c21] rounded-xl p-3 border border-[#272a30] shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#4edea3] text-[20px]">bolt</span>
                <div>
                  <h3 className="text-headline-sm text-[#e1e2ea] font-bold">
                    Fast Execution Dock: {selectedPair.id.replace('-', ' / ')}
                  </h3>
                  <span className="text-body-sm text-[#9b8f7f]">
                    Spread Basis: +₹{selectedPair.grossSpread} (Net Edge: +₹{selectedPair.netArbEdge}/10g)
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#4edea3]/20 text-[#4edea3] text-label-mono-micro font-bold">
                75% SPAN RELIEF
              </span>
            </div>

            {/* Level 2 Order Book Depth Table */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-2.5">
              {/* Bid Depth */}
              <div className="bg-[#111319] p-2 rounded border border-[#272a30]">
                <div className="flex items-center justify-between text-[#9b8f7f] text-[10px] border-b border-[#272a30] pb-1 mb-1">
                  <span>BUY SPREAD</span>
                  <span>LOTS</span>
                </div>
                <div className="space-y-1">
                  {spreadBids.map((b, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedSpreadPrice(b.spread)}
                      className="w-full flex items-center justify-between py-0.5 hover:bg-[#272a30] rounded px-1 transition-colors cursor-pointer"
                    >
                      <span className="text-[#4edea3] font-bold">+₹{b.spread}</span>
                      <span className="text-[#e1e2ea]">{b.lots}L</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Ask Depth */}
              <div className="bg-[#111319] p-2 rounded border border-[#272a30]">
                <div className="flex items-center justify-between text-[#9b8f7f] text-[10px] border-b border-[#272a30] pb-1 mb-1">
                  <span>SELL SPREAD</span>
                  <span>LOTS</span>
                </div>
                <div className="space-y-1">
                  {spreadAsks.map((a, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedSpreadPrice(a.spread)}
                      className="w-full flex items-center justify-between py-0.5 hover:bg-[#272a30] rounded px-1 transition-colors cursor-pointer"
                    >
                      <span className="text-[#ffb4ab] font-bold">+₹{a.spread}</span>
                      <span className="text-[#e1e2ea]">{a.lots}L</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2.5 font-mono text-xs">
              {/* Lots & Mode */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-[#9b8f7f] block mb-1">LOT SIZING (1 LOT = 1 KG)</label>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setDockLots(Math.max(1, dockLots - 1))}
                      className="w-8 h-8 rounded bg-[#272a30] text-[#e1e2ea] font-bold flex items-center justify-center hover:bg-[#32353b] cursor-pointer"
                    >
                      -
                    </button>
                    <div className="flex-1 h-8 rounded bg-[#111319] border border-[#272a30] flex items-center justify-center font-bold text-sm text-[#ffd58d]">
                      {dockLots} Lots
                    </div>
                    <button
                      onClick={() => setDockLots(dockLots + 1)}
                      className="w-8 h-8 rounded bg-[#272a30] text-[#e1e2ea] font-bold flex items-center justify-center hover:bg-[#32353b] cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-[#9b8f7f] block mb-1">ORDER ROUTE</label>
                  <select
                    value={dockOrderType}
                    onChange={(e) => setDockOrderType(e.target.value as any)}
                    className="w-full h-8 bg-[#111319] border border-[#272a30] rounded px-2 text-xs font-mono text-[#e1e2ea] cursor-pointer"
                  >
                    <option value="LIMIT">LIMIT (+₹{selectedSpreadPrice})</option>
                    <option value="MARKET">MARKET (Atomic Fill)</option>
                    <option value="IOC">IOC (Immediate Or Cancel)</option>
                  </select>
                </div>
              </div>

              {/* Quick Lots Preset Buttons */}
              <div className="flex items-center gap-1">
                {[1, 5, 10, 25, 50].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setDockLots(preset)}
                    className={`flex-1 py-1 rounded text-xs transition-colors cursor-pointer ${
                      dockLots === preset
                        ? 'bg-[#ffd58d] text-[#422c00] font-bold'
                        : 'bg-[#272a30] text-[#d2c5b3] hover:text-white'
                    }`}
                  >
                    {preset}L
                  </button>
                ))}
              </div>

              {/* Telemetry Row */}
              <div className="p-2.5 rounded bg-[#111319] border border-[#272a30] space-y-1 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-[#9b8f7f]">Estimated Net Edge P&L:</span>
                  <span className="text-[#4edea3] font-bold">
                    +₹{(selectedPair.lotValueEdge * dockLots).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#9b8f7f]">Margin Required:</span>
                  <span className="text-[#ffd58d]">₹{((340000 * dockLots) / 100000).toFixed(2)} Lakhs</span>
                </div>
              </div>

              {/* Execution Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  disabled={orderExecuting}
                  onClick={() => handleFastOrder('BUY_SPREAD')}
                  className="py-2.5 px-3 rounded bg-[#93000a]/30 border border-[#ffb4ab]/40 hover:bg-[#93000a]/50 text-[#ffb4ab] font-bold text-xs uppercase transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px]">trending_down</span>
                  Buy Spread ({dockLots}L)
                </button>
                <button
                  disabled={orderExecuting}
                  onClick={() => handleFastOrder('SELL_SPREAD')}
                  className="py-2.5 px-3 rounded bg-[#4edea3] hover:bg-[#6ffbbe] text-[#003824] font-bold text-xs uppercase transition-all shadow-[0_0_12px_rgba(78,222,163,0.3)] flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px]">trending_up</span>
                  {orderExecuting ? 'Routing...' : `Sell Spread (${dockLots}L)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM INSTITUTIONAL DOCK / WORKSTATION DRAWER (Full Width) */}
      <div className="bg-[#191c21] rounded-xl border border-[#272a30] shadow-2xl mt-2 overflow-hidden">
        {/* Dock Navigation Bar */}
        <div className="bg-[#111319] px-4 py-2 border-b border-[#272a30] flex items-center justify-between">
          <div className="flex items-center gap-3">
            {[
              { id: 'POSITIONS' as const, label: `Active Positions (${positions.length})`, icon: 'account_balance_wallet' },
              { id: 'COST_MODEL' as const, label: 'Cost-of-Carry Breakdown', icon: 'calculate' },
              { id: 'Z_CHANNEL' as const, label: '30-Day Z-Score Channel', icon: 'show_chart' },
              { id: 'AUDIT_TAPE' as const, label: 'OMS Tick Prints Tape', icon: 'receipt_long' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setDockTab(tab.id)}
                className={`flex items-center gap-1.5 py-1 px-2.5 rounded font-mono text-xs font-semibold transition-all cursor-pointer ${
                  dockTab === tab.id
                    ? 'bg-[#272a30] text-[#ffd58d] border-b-2 border-[#ffd58d]'
                    : 'text-[#9b8f7f] hover:text-[#e1e2ea]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-label-mono-micro text-[#9b8f7f] font-mono">
            GATEWAY: FIX 4.4 ULTRA-DMA (0.84ms)
          </span>
        </div>

        {/* Dock Tab Content */}
        <div className="p-4 max-h-72 overflow-y-auto">
          {dockTab === 'POSITIONS' && (
            <div className="space-y-2">
              {positions.length === 0 ? (
                <div className="p-6 text-center text-[#9b8f7f] font-mono text-xs">
                  No active spread positions. Click "Sell Spread" or "Buy Spread" above to execute an arbitrage trade.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono text-left">
                    <thead>
                      <tr className="text-[#9b8f7f] border-b border-[#272a30] pb-1">
                        <th className="py-1">POSITION ID</th>
                        <th>PAIR</th>
                        <th>DIRECTION</th>
                        <th>LOTS</th>
                        <th>ENTRY SPREAD</th>
                        <th>CURRENT</th>
                        <th>UNREALIZED P&amp;L</th>
                        <th>MARGIN USED</th>
                        <th>TENDER RISK</th>
                        <th className="text-right">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#272a30]">
                      {positions.map((p) => (
                        <tr key={p.id} className="hover:bg-[#272a30]/30 transition-colors">
                          <td className="py-2 text-[#e1e2ea] font-bold">{p.id}</td>
                          <td className="text-[#ffd58d] font-bold">{p.pairId}</td>
                          <td>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                p.direction === 'SELL_SPREAD' ? 'bg-[#4edea3]/20 text-[#4edea3]' : 'bg-[#ffb4ab]/20 text-[#ffb4ab]'
                              }`}
                            >
                              {p.direction === 'SELL_SPREAD' ? 'SHORT ARB' : 'LONG ARB'}
                            </span>
                          </td>
                          <td className="text-[#e1e2ea]">{p.lots}L</td>
                          <td className="text-[#d2c5b3]">₹{p.entrySpread}</td>
                          <td className="text-[#ffd58d] font-bold">₹{p.currentSpread}</td>
                          <td className={`font-bold ${p.unrealizedPnl >= 0 ? 'text-[#4edea3]' : 'text-[#ffb4ab]'}`}>
                            {p.unrealizedPnl >= 0 ? `+₹${p.unrealizedPnl.toLocaleString('en-IN')}` : `-₹${Math.abs(p.unrealizedPnl).toLocaleString('en-IN')}`}
                          </td>
                          <td className="text-[#7bd0ff]">₹{(p.marginUsed / 100000).toFixed(1)}L</td>
                          <td>
                            <span className={p.daysToTender <= 5 ? 'text-[#ffb4ab] font-bold' : 'text-[#9b8f7f]'}>
                              {p.daysToTender} Days
                            </span>
                          </td>
                          <td className="text-right space-x-1.5">
                            <button
                              onClick={() => onRollPosition(p.id)}
                              className="px-2 py-0.5 rounded bg-[#272a30] hover:bg-[#32353b] text-[#ffd58d] text-[11px] cursor-pointer"
                            >
                              Roll
                            </button>
                            <button
                              onClick={() => onSquareOff(p.id)}
                              className="px-2 py-0.5 rounded bg-[#93000a]/30 hover:bg-[#93000a]/50 text-[#ffb4ab] text-[11px] cursor-pointer"
                            >
                              Square Off
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {dockTab === 'COST_MODEL' && (
            <div className="space-y-3 font-mono text-xs">
              <div className="grid grid-cols-4 gap-4">
                <div className="p-3 rounded bg-[#111319] border border-[#272a30]">
                  <span className="text-[#9b8f7f] block text-[10px]">SPOT GOLD ANCHOR</span>
                  <span className="text-sm font-bold text-[#ffd58d]">₹{costParams.spotPrice.toLocaleString('en-IN')}/10g</span>
                  <span className="text-[10px] text-[#9b8f7f]">995 Fineness Accredited</span>
                </div>
                <div className="p-3 rounded bg-[#111319] border border-[#272a30]">
                  <span className="text-[#9b8f7f] block text-[10px]">TOTAL BORROW RATE</span>
                  <span className="text-sm font-bold text-[#7bd0ff]">
                    {(costParams.miborRate + costParams.deskBorrowSpreadBps / 100).toFixed(2)}% p.a.
                  </span>
                  <span className="text-[10px] text-[#9b8f7f]">MIBOR {costParams.miborRate}% + {costParams.deskBorrowSpreadBps}bps</span>
                </div>
                <div className="p-3 rounded bg-[#111319] border border-[#272a30]">
                  <span className="text-[#9b8f7f] block text-[10px]">DEMAT STORAGE CHARGE</span>
                  <span className="text-sm font-bold text-[#4edea3]">
                    ₹{costParams.vaultStoragePer100gPerDay.toFixed(2)} / 100g / day
                  </span>
                  <span className="text-[10px] text-[#9b8f7f]">₹{(costParams.vaultStoragePer100gPerDay * 10).toFixed(2)}/kg/day</span>
                </div>
                <div className="p-3 rounded bg-[#111319] border border-[#272a30]">
                  <span className="text-[#9b8f7f] block text-[10px]">TRANSIT &amp; TURNOVER</span>
                  <span className="text-sm font-bold text-[#e1e2ea]">0.0326%</span>
                  <span className="text-[10px] text-[#9b8f7f]">MCX CTT + Assaying</span>
                </div>
              </div>

              {/* Interactive Sliders in Cost Model Dock */}
              <div className="grid grid-cols-3 gap-4 pt-2 border-t border-[#272a30]">
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-[#9b8f7f]">MIBOR Benchmark:</span>
                    <span className="text-[#ffd58d] font-bold">{costParams.miborRate}%</span>
                  </div>
                  <input
                    type="range"
                    min="4.0"
                    max="9.0"
                    step="0.1"
                    value={costParams.miborRate}
                    onChange={(e) => setCostParams({ ...costParams, miborRate: parseFloat(e.target.value) })}
                    className="w-full accent-[#ffd58d] h-1 bg-[#272a30] rounded cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-[#9b8f7f]">Vault Storage:</span>
                    <span className="text-[#4edea3] font-bold">₹{costParams.vaultStoragePer100gPerDay}/day</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="6.0"
                    step="0.25"
                    value={costParams.vaultStoragePer100gPerDay}
                    onChange={(e) => setCostParams({ ...costParams, vaultStoragePer100gPerDay: parseFloat(e.target.value) })}
                    className="w-full accent-[#4edea3] h-1 bg-[#272a30] rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => setCostParams(initialCostParams)}
                    className="w-full py-1.5 rounded bg-[#272a30] hover:bg-[#32353b] text-[#ffd58d] text-[11px] cursor-pointer"
                  >
                    Reset Defaults
                  </button>
                </div>
              </div>
            </div>
          )}

          {dockTab === 'Z_CHANNEL' && (
            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[#ffd58d] font-bold block text-sm">
                    30-Day Calendar Spread Statistical Distribution:
                  </span>
                  <p className="text-[#9b8f7f] text-[11px] mt-0.5">
                    Mean = ₹610.00 | Standard Deviation (1σ) = ₹67.20 | 95% Confidence Band = ₹475.60 to ₹744.40
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[#6ffbbe] font-bold text-sm block">Current: +2.38σ</span>
                  <span className="text-[#4edea3] text-[10px]">Statistical Reversion Probability: 89.2%</span>
                </div>
              </div>

              {/* Progress Gauges for Z-Score */}
              <div className="p-3 rounded bg-[#111319] border border-[#272a30] space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#7bd0ff]">-3.0σ Extreme Discount</span>
                  <span className="text-[#9b8f7f]">0.0σ Fair Value</span>
                  <span className="text-[#4edea3]">+2.38σ Current Spread</span>
                  <span className="text-[#ffb4ab]">+3.0σ Extreme Rich</span>
                </div>
                <div className="h-2 w-full bg-[#272a30] rounded-full relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-[89%] bg-gradient-to-r from-[#7bd0ff] via-[#ffd58d] to-[#4edea3] rounded-full"></div>
                </div>
              </div>
            </div>
          )}

          {dockTab === 'AUDIT_TAPE' && (
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex items-center justify-between text-[#9b8f7f] text-[10px] border-b border-[#272a30] pb-1">
                <span>TIMESTAMP</span>
                <span>INSTRUMENT</span>
                <span>ORDER TYPE</span>
                <span>QTY</span>
                <span>FILL SPREAD</span>
                <span>STATUS / GATEWAY</span>
              </div>
              <div className="divide-y divide-[#272a30]/60 max-h-52 overflow-y-auto">
                {omsPrints.map((print) => (
                  <div key={print.id} className="flex items-center justify-between py-1 text-[11px] hover:bg-[#272a30]/30 transition-colors">
                    <span className="text-[#9b8f7f]">{print.timestamp}</span>
                    <span className="text-[#ffd58d] font-bold">{print.instrument}</span>
                    <span className={print.direction === 'SELL' ? 'text-[#4edea3] font-bold' : 'text-[#ffb4ab] font-bold'}>
                      {print.direction} SPREAD
                    </span>
                    <span className="text-[#e1e2ea]">{print.lots} Lots</span>
                    <span className="font-bold text-[#ffd58d]">+₹{print.spread}.00</span>
                    <span className="text-[#7bd0ff] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3]"></span>
                      {print.status} (FIX 4.4)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
