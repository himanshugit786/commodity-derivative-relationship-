import React, { useState } from 'react';
import { CalendarPair, TenorContract } from '../types/arbitrage';

interface SpreadCurveViewProps {
  tenors: TenorContract[];
  pairs: CalendarPair[];
  selectedPair: CalendarPair;
  onSelectPair: (pair: CalendarPair) => void;
  onOpenExecution: (direction: 'BUY_SPREAD' | 'SELL_SPREAD') => void;
  onOpenVaultModal: () => void;
}

export const SpreadCurveView: React.FC<SpreadCurveViewProps> = ({
  tenors,
  pairs,
  selectedPair,
  onSelectPair,
  onOpenExecution,
  onOpenVaultModal,
}) => {
  // Metric toggle mode: PRICE or IMPLIED
  const [chartMode, setChartMode] = useState<'PRICE' | 'IMPLIED'>('PRICE');

  // Interactive selected chart node tooltip
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Sorting state for Calendar Pair Matrix
  const [sortBy, setSortBy] = useState<'default' | 'zscore' | 'edge' | 'liquidity'>('default');

  // Macro Rate Shift Simulator state
  const [rateShockBps, setRateShockBps] = useState<number>(0);

  // Sorted pairs based on selection
  const sortedPairs = [...pairs].sort((a, b) => {
    if (sortBy === 'zscore') return Math.abs(b.zScore) - Math.abs(a.zScore);
    if (sortBy === 'edge') return b.netArbEdge - a.netArbEdge;
    if (sortBy === 'liquidity') return b.liquidityBars - a.liquidityBars;
    return 0; // default order
  });

  const handleToggleSort = () => {
    if (sortBy === 'default') setSortBy('zscore');
    else if (sortBy === 'zscore') setSortBy('edge');
    else if (sortBy === 'edge') setSortBy('liquidity');
    else setSortBy('default');
  };

  // Base values for simulation
  const baselineMibor = 6.75;
  const simulatedMibor = baselineMibor + rateShockBps / 100;

  // Impact of rate shock on theoretical carry cost:
  // For ~61 days on ~₹72,500 gold: 50bps shock = ~₹72,500 * (0.005) * (61/365) = ~₹60.6 -> approx ₹45 after netting
  const theoDeltaGap = Math.round((rateShockBps / 50) * 45);
  const simulatedTheoCarry = 610 + theoDeltaGap;
  const simulatedNetEdge = 770 - simulatedTheoCarry; // 160 baseline

  return (
    <div className="flex flex-col w-full pb-20">
      {/* Live Market Status Ribbon */}
      <div className="px-3 sm:px-4 pt-1.5 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-ping"></span>
          <span className="text-label-mono-micro text-[#4edea3] font-bold tracking-wider">
            REGIME: STEEP CONTANGO
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#272a30]">
          <span className="material-symbols-outlined text-[13px] text-[#ffd58d]">
            account_balance
          </span>
          <span className="text-label-numeric-sm text-[#d2c5b3] font-medium">MIBOR 6.75%</span>
          <span className="text-label-mono-micro text-[#4edea3] font-semibold">+42bps SPREAD</span>
        </div>
      </div>

      {/* Key Metrics Summary Grid */}
      <div className="px-3 sm:px-4 mb-2 grid grid-cols-3 gap-2">
        <div className="bg-[#1d2025] p-2 sm:p-2.5 rounded-lg flex flex-col justify-between border border-[#272a30]">
          <div className="flex items-center justify-between text-[#9b8f7f]">
            <span className="text-label-mono-micro uppercase">Max Slope</span>
            <span className="material-symbols-outlined text-[14px]">trending_up</span>
          </div>
          <div className="mt-1">
            <div className={`text-label-numeric-lg font-bold transition-colors ${selectedPair.tickDirection === 'up' ? 'text-[#4edea3]' : selectedPair.tickDirection === 'down' ? 'text-[#ffb4ab]' : 'text-[#ffd58d]'}`}>
              ₹{selectedPair.grossSpread}
              <span className="text-label-numeric-sm font-normal text-[#d2c5b3]">/10g</span>
            </div>
            <span className="text-label-mono-micro text-[#4edea3] uppercase font-bold">{selectedPair.id} NODE</span>
          </div>
        </div>

        <div className="bg-[#1d2025] p-2 sm:p-2.5 rounded-lg flex flex-col justify-between border border-[#272a30]">
          <div className="flex items-center justify-between text-[#9b8f7f]">
            <span className="text-label-mono-micro uppercase">Annualized</span>
            <span className="material-symbols-outlined text-[14px]">percent</span>
          </div>
          <div className="mt-1">
            <div className="text-label-numeric-lg text-[#c4e7ff] font-bold">{selectedPair.carryExpenseAnnRate}%</div>
            <span className="text-label-mono-micro text-[#b2e1ff] font-medium">
              +43bps vs Repo
            </span>
          </div>
        </div>

        <div className="bg-[#1d2025] p-2 sm:p-2.5 rounded-lg flex flex-col justify-between border border-[#272a30]">
          <div className="flex items-center justify-between text-[#9b8f7f]">
            <span className="text-label-mono-micro uppercase">Peak Arb σ</span>
            <span className="material-symbols-outlined text-[14px]">crisis_alert</span>
          </div>
          <div className="mt-1">
            <div className="text-label-numeric-lg text-[#6ffbbe] font-bold">
              {selectedPair.zScore > 0 ? `+${selectedPair.zScore}σ` : `${selectedPair.zScore}σ`}
            </div>
            <span className="text-label-mono-micro text-[#ffdea9] uppercase font-semibold">
              {selectedPair.zScoreLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Term Structure Interactive Chart Section */}
      <div className="px-3 sm:px-4 mb-2">
        <div className="bg-[#191c21] rounded-xl p-2.5 sm:p-3 shadow-md border border-[#272a30]">
          {/* Chart Controls Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <h2 className="text-headline-sm text-[#e1e2ea] tracking-tight font-bold">
                  MCX Gold Forward Curve
                </h2>
                <span className="px-1.5 py-0.5 rounded bg-[#e5b869]/20 text-[#ffd58d] text-label-mono-micro font-bold">
                  LIVE DIVERGENCE
                </span>
              </div>
              <span className="text-body-sm text-[#9b8f7f]">
                Maturities: M24 (Aug), V24 (Oct), Z24 (Dec), G25 (Feb)
              </span>
            </div>

            {/* Metric Mode Toggle Pill */}
            <div className="flex items-center bg-[#32353b] p-0.5 rounded">
              <button
                onClick={() => setChartMode('PRICE')}
                className={`px-2 py-1 rounded text-label-mono-micro font-semibold transition-all ${
                  chartMode === 'PRICE'
                    ? 'bg-[#e5b869] text-[#674800]'
                    : 'text-[#d2c5b3] hover:text-[#e1e2ea]'
                }`}
              >
                PRICE (₹)
              </button>
              <button
                onClick={() => setChartMode('IMPLIED')}
                className={`px-2 py-1 rounded text-label-mono-micro font-semibold transition-all ${
                  chartMode === 'IMPLIED'
                    ? 'bg-[#e5b869] text-[#674800]'
                    : 'text-[#d2c5b3] hover:text-[#e1e2ea]'
                }`}
              >
                IMPLIED %
              </button>
            </div>
          </div>

          {/* Chart Canvas & SVG Container */}
          <div className="relative w-full h-52 bg-[#0b0e13] rounded-lg overflow-hidden p-2 border border-[#1d2025]">
            {/* Grid Guidelines */}
            <div className="absolute inset-x-2 top-2 bottom-6 flex flex-col justify-between pointer-events-none opacity-20">
              <div className="w-full h-px bg-[#4e4538]"></div>
              <div className="w-full h-px bg-[#4e4538]"></div>
              <div className="w-full h-px bg-[#4e4538]"></div>
              <div className="w-full h-px bg-[#4e4538]"></div>
            </div>

            {/* SVG Curve Display */}
            {chartMode === 'PRICE' ? (
              <svg
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
                viewBox="0 0 340 160"
              >
                <defs>
                  <linearGradient id="cyanSpreadGlow" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#7bd0ff" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#7bd0ff" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Arbitrage Gap Shaded Zone between V24 (x=120) and Z24 (x=215) */}
                <polygon
                  fill="rgba(237, 191, 112, 0.22)"
                  points="120,86 215,50 215,70 120,86"
                />

                {/* Market Curve Area Fill */}
                <path
                  d="M 30,126 L 120,86 L 215,50 L 310,22 L 310,150 L 30,150 Z"
                  fill="url(#cyanSpreadGlow)"
                />

                {/* Theoretical Fair Value Curve (Dashed Gold) */}
                {/* Aug: 126, Oct: 92 (+670), Dec: 70 (+610), Feb: 38 */}
                <path
                  d={`M 30,126 L 120,${92 - (rateShockBps / 50) * 4} L 215,${70 - (rateShockBps / 50) * 8} L 310,${38 - (rateShockBps / 50) * 12}`}
                  fill="none"
                  stroke="#edbf70"
                  strokeDasharray="4,4"
                  strokeWidth="2"
                />

                {/* Market Spot/Futures Price Curve (Cyan Solid) */}
                {/* Aug: 126, Oct: 86 (+770!), Dec: 50, Feb: 22 */}
                <path
                  d="M 30,126 L 120,86 L 215,50 L 310,22"
                  fill="none"
                  stroke="#7bd0ff"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                />

                {/* Arbitrage Delta Callout Marker */}
                <line stroke="#ffd58d" strokeWidth="1.5" x1="215" x2="215" y1="50" y2={70 - (rateShockBps / 50) * 8} />
                <circle cx="215" cy="50" fill="#7bd0ff" r="4" className="cursor-pointer" />
                <circle cx="215" cy={70 - (rateShockBps / 50) * 8} fill="#edbf70" r="3.5" className="cursor-pointer" />

                {/* Market Data Points */}
                <circle
                  cx="30"
                  cy="126"
                  fill="#7bd0ff"
                  r="3.5"
                  className="cursor-pointer hover:r-5 transition-all"
                  onClick={() => setHoveredNode('AUG24')}
                />
                <circle
                  cx="120"
                  cy="86"
                  fill="#7bd0ff"
                  r="3.5"
                  className="cursor-pointer hover:r-5 transition-all"
                  onClick={() => setHoveredNode('OCT24')}
                />
                <circle
                  cx="310"
                  cy="22"
                  fill="#7bd0ff"
                  r="3.5"
                  className="cursor-pointer hover:r-5 transition-all"
                  onClick={() => setHoveredNode('FEB25')}
                />

                {/* Tooltip Badge overlaying the Dec anomaly */}
                <g
                  transform="translate(145, 18)"
                  className="cursor-pointer"
                  onClick={() => setHoveredNode('DEC24')}
                >
                  <rect
                    fill="#191c21"
                    height="22"
                    rx="3"
                    stroke="#edbf70"
                    strokeWidth="0.75"
                    width="84"
                  />
                  <text
                    fill="#ffd58d"
                    fontFamily="JetBrains Mono"
                    fontSize="8.5"
                    fontWeight="700"
                    x="5"
                    y="15"
                  >
                    +₹{selectedPair.netArbEdge} {selectedPair.netArbEdge > 0 ? 'RICH' : 'DRAG'}
                  </text>
                  <text
                    fill="#4edea3"
                    fontFamily="JetBrains Mono"
                    fontSize="8.5"
                    fontWeight="700"
                    x="55"
                    y="15"
                  >
                    {selectedPair.zScore > 0 ? `+${selectedPair.zScore}σ` : `${selectedPair.zScore}σ`}
                  </text>
                </g>
              </svg>
            ) : (
              /* Implied Yield Term Structure Mode */
              <svg
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
                viewBox="0 0 340 160"
              >
                {/* Horizontal benchmark line for MIBOR */}
                <line
                  stroke="#9b8f7f"
                  strokeWidth="1.5"
                  strokeDasharray="3,3"
                  x1="20"
                  x2="320"
                  y1="90"
                  y2="90"
                />
                <text
                  fill="#9b8f7f"
                  fontFamily="JetBrains Mono"
                  fontSize="8"
                  x="20"
                  y="85"
                >
                  MIBOR HURDLE {simulatedMibor.toFixed(2)}%
                </text>

                {/* Implied Yield Line */}
                <path
                  d="M 30,100 L 120,75 L 215,30 L 310,70"
                  fill="none"
                  stroke="#4edea3"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="30" cy="100" fill="#4edea3" r="3.5" />
                <circle cx="120" cy="75" fill="#4edea3" r="3.5" />
                <circle cx="215" cy="30" fill="#ffd58d" r="4.5" />
                <circle cx="310" cy="70" fill="#4edea3" r="3.5" />

                <g transform="translate(170, 10)">
                  <rect fill="#191c21" height="18" rx="3" stroke="#4edea3" strokeWidth="0.5" width="90" />
                  <text fill="#ffd58d" fontFamily="JetBrains Mono" fontSize="8" fontWeight="700" x="5" y="12">
                    DEC: 8.42% (+167bps)
                  </text>
                </g>
              </svg>
            )}

            {/* Dynamic Axis Labels */}
            <div className="absolute bottom-1 inset-x-2 flex justify-between px-2 text-[#9b8f7f] text-label-mono-micro">
              <div
                className="flex flex-col items-center cursor-pointer"
                onClick={() => setHoveredNode('AUG24')}
              >
                <span className="text-[#e1e2ea] font-semibold">AUG24</span>
                <span className="text-[#edbf70]">
                  {chartMode === 'PRICE' ? `₹${(tenors.find(t => t.code === 'AUG24')?.price || 71840).toLocaleString('en-IN')}` : '6.42%'}
                </span>
              </div>
              <div
                className="flex flex-col items-center cursor-pointer"
                onClick={() => setHoveredNode('OCT24')}
              >
                <span className="text-[#e1e2ea] font-semibold">OCT24</span>
                <span className="text-[#edbf70]">
                  {chartMode === 'PRICE' ? `₹${(tenors.find(t => t.code === 'OCT24')?.price || 72510).toLocaleString('en-IN')}` : '7.18%'}
                </span>
              </div>
              <div
                className="flex flex-col items-center relative cursor-pointer"
                onClick={() => setHoveredNode('DEC24')}
              >
                <span className="text-[#4edea3] font-bold">DEC24*</span>
                <span className="text-[#6ffbbe] font-bold">
                  {chartMode === 'PRICE' ? `₹${(tenors.find(t => t.code === 'DEC24')?.price || 73280).toLocaleString('en-IN')}` : '8.42%'}
                </span>
              </div>
              <div
                className="flex flex-col items-center cursor-pointer"
                onClick={() => setHoveredNode('FEB25')}
              >
                <span className="text-[#e1e2ea] font-semibold">FEB25</span>
                <span className="text-[#edbf70]">
                  {chartMode === 'PRICE' ? `₹${(tenors.find(t => t.code === 'FEB25')?.price || 73990).toLocaleString('en-IN')}` : '7.35%'}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Node Info Box (if node clicked) */}
          {hoveredNode && (
            <div className="mt-2 p-2 bg-[#0b0e13] rounded border border-[#ffd58d]/30 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-[#ffd58d] font-bold">{hoveredNode}</span>
                <span className="text-[#d2c5b3]">
                  {hoveredNode === 'DEC24'
                    ? 'Market: ₹73,280 | Theo: ₹73,120 (Dislocated +₹160)'
                    : hoveredNode === 'OCT24'
                    ? 'Market: ₹72,510 | Theo: ₹72,482'
                    : hoveredNode === 'AUG24'
                    ? 'Spot / Prompt: ₹71,840 (Anchor)'
                    : 'Market: ₹73,990 | Theo: ₹73,868'}
                </span>
              </div>
              <button
                onClick={() => setHoveredNode(null)}
                className="text-[10px] text-[#9b8f7f] hover:text-white"
              >
                ✕
              </button>
            </div>
          )}

          {/* Chart Legend & Anomaly Descriptor */}
          <div className="mt-2 pt-1.5 flex items-center justify-between text-[#9b8f7f] text-label-numeric-sm border-t border-[#272a30]">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="w-3 h-0.5 bg-[#7bd0ff] rounded-full"></span>
                <span className="text-[#d2c5b3] font-mono text-[10px]">MCX Market</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-0.5 bg-[#edbf70] rounded-full border-b border-dashed"></span>
                <span className="text-[#d2c5b3] font-mono text-[10px]">Cost-of-Carry (Fair)</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[#ffd58d]">
              <span className="material-symbols-outlined text-[13px]">lightbulb</span>
              <span className="text-body-sm font-medium">Oct-Dec Gap +₹770 vs Theo +₹610</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tenor Pair Matrix Table */}
      <div className="px-3 sm:px-4 mb-2">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-headline-sm text-[#e1e2ea] tracking-tight font-bold">
              Calendar Pair Matrix
            </span>
            <span className="text-label-mono-micro px-1 rounded bg-[#272a30] text-[#d2c5b3]">
              {pairs.length} PAIRS MONITORED
            </span>
          </div>
          <button
            onClick={handleToggleSort}
            className="text-label-mono-micro text-[#ffd58d] hover:text-[#ffdea9] flex items-center gap-0.5 active:scale-95 transition-transform font-bold cursor-pointer"
          >
            <span>
              {sortBy === 'default'
                ? 'AUTO-RANK'
                : sortBy === 'zscore'
                ? 'BY Z-SCORE'
                : sortBy === 'edge'
                ? 'BY NET EDGE'
                : 'BY LIQUIDITY'}
            </span>
            <span className="material-symbols-outlined text-[14px]">sort</span>
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          {sortedPairs.map((pair) => {
            const isSelected = selectedPair.id === pair.id;
            const isTopArb = pair.id === 'OCT24-DEC24';

            return (
              <div
                key={pair.id}
                onClick={() => onSelectPair(pair)}
                className={`bg-[#1d2025] rounded-lg p-2.5 shadow-md transition-all cursor-pointer relative overflow-hidden border ${
                  isSelected
                    ? 'border-[#ffd58d] ring-1 ring-[#ffd58d]/30'
                    : isTopArb
                    ? 'border-[#4edea3]/40'
                    : 'border-[#272a30]'
                }`}
              >
                {/* Hot Alert Glow Ribbon for Top Arb */}
                {isTopArb && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#4edea3]"></div>
                )}

                <div className={isTopArb ? 'pl-2' : ''}>
                  {/* Pair Header Row */}
                  <div className="flex items-center justify-between pb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-headline-sm text-[#e1e2ea] font-bold">
                        {pair.nearLeg} - {pair.farLeg}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-label-mono-micro font-bold ${
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
                        className={`text-label-numeric-lg font-bold ${
                          pair.zScore > 2
                            ? 'text-[#6ffbbe]'
                            : pair.zScore > 0
                            ? 'text-[#ffd58d]'
                            : 'text-[#e1e2ea]'
                        }`}
                      >
                        {pair.zScore > 0 ? `+${pair.zScore}σ` : `${pair.zScore}σ`}
                      </span>
                      <span
                        className={`block text-label-mono-micro font-semibold uppercase ${
                          pair.zScore > 2
                            ? 'text-[#4edea3]'
                            : pair.zScore > 0
                            ? 'text-[#ffdea9]'
                            : 'text-[#9b8f7f]'
                        }`}
                      >
                        {pair.zScoreLabel}
                      </span>
                    </div>
                  </div>

                  {/* Pair Metric Grid */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1 mt-1 bg-[#0b0e13]/60 p-2 rounded">
                    <div>
                      <span className="text-label-mono-micro text-[#9b8f7f] block">GROSS SPREAD</span>
                      <span
                        className={`text-label-numeric-md font-bold ${
                          isTopArb ? 'text-[#ffd58d]' : 'text-[#e1e2ea]'
                        }`}
                      >
                        +₹{pair.grossSpread}
                      </span>
                      <span className="text-label-mono-micro text-[#d2c5b3] block">
                        {pair.grossSpreadBps} bps
                      </span>
                    </div>

                    <div>
                      <span className="text-label-mono-micro text-[#9b8f7f] block">CARRY EXP</span>
                      <span className="text-label-numeric-md text-[#e1e2ea] font-mono">
                        ₹{pair.carryExpense}
                      </span>
                      <span className="text-label-mono-micro text-[#9b8f7f] block">
                        {pair.carryExpenseAnnRate}% ann.
                      </span>
                    </div>

                    <div>
                      <span className="text-label-mono-micro text-[#9b8f7f] block">NET ARB EDG</span>
                      <span
                        className={`text-label-numeric-md font-bold ${
                          pair.netArbEdge > 0
                            ? isTopArb
                              ? 'text-[#4edea3]'
                              : 'text-[#ffd58d]'
                            : 'text-[#ffb4ab]'
                        }`}
                      >
                        {pair.netArbEdge > 0 ? `+₹${pair.netArbEdge}` : `-₹${Math.abs(pair.netArbEdge)}`}
                      </span>
                      <span
                        className={`text-label-mono-micro block ${
                          pair.netArbEdge > 0 ? 'text-[#4edea3]' : 'text-[#ffb4ab]'
                        }`}
                      >
                        {pair.netArbEdge > 0
                          ? `₹${pair.lotValueEdge.toLocaleString('en-IN')}/Lot`
                          : 'Carry Drag'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-label-mono-micro text-[#9b8f7f] block">LIQUIDITY</span>
                      <div className="flex items-center justify-end gap-1 mt-0.5">
                        {[1, 2, 3, 4].map((bar) => (
                          <span
                            key={bar}
                            className={`w-1.5 h-3 rounded-[1px] ${
                              bar <= pair.liquidityBars
                                ? 'bg-[#4edea3]'
                                : 'bg-[#36393f]'
                            }`}
                          ></span>
                        ))}
                      </div>
                      <span className="text-label-numeric-sm text-[#e1e2ea] font-mono">
                        {pair.liquidityTier}
                      </span>
                    </div>
                  </div>

                  {/* Inline Direct Route Button for Top Opportunity */}
                  {isTopArb ? (
                    <div className="mt-2 flex items-center justify-between pt-1">
                      <span className="text-body-sm text-[#d2c5b3]">
                        Implied Borrow:{' '}
                        <strong className="text-[#e1e2ea] font-mono">
                          {pair.impliedBorrowRate}% p.a.
                        </strong>{' '}
                        (Cost +{pair.impliedBorrowSpreadBps}bps)
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenExecution('SELL_SPREAD');
                        }}
                        className="px-3 py-1.5 rounded bg-[#4edea3] hover:bg-[#6ffbbe] text-[#003824] text-label-mono-micro font-bold uppercase tracking-wide flex items-center gap-1 active:scale-95 shadow-sm transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[13px]">call_split</span>
                        Route Short Arb
                      </button>
                    </div>
                  ) : (
                    <div className="mt-1 flex items-center justify-between pt-1 text-body-sm text-[#9b8f7f]">
                      <span>
                        Implied Borrow: <strong className="text-[#d2c5b3] font-mono">{pair.impliedBorrowRate}% p.a.</strong>
                      </span>
                      <span className="text-label-mono-micro text-[#ffd58d]">
                        TAP TO INSPECT
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Calendar Roll Risk & Physical Delivery Timeline */}
      <div className="px-3 sm:px-4 mb-2">
        <div className="bg-[#191c21] rounded-xl p-2.5 sm:p-3 border border-[#272a30]">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#ffd58d] text-[18px]">
                event_repeat
              </span>
              <h3 className="text-headline-sm text-[#e1e2ea] font-bold">
                Roll Risk &amp; Tender Milestones
              </h3>
            </div>
            <span className="text-label-mono-micro text-[#d2c5b3] font-mono">
              LOT: 1 KG (1000g)
            </span>
          </div>

          {/* Timeline Phase Tracker */}
          <div className="relative pt-3 pb-2">
            <div className="h-1 w-full bg-[#272a30] rounded relative mb-4">
              <div className="absolute left-0 top-0 bottom-0 w-[42%] bg-[#4edea3] rounded"></div>
              {/* Node 1: Current Day */}
              <div className="absolute left-[42%] -top-1 w-3 h-3 rounded-full bg-[#4edea3] shadow-[0_0_8px_rgba(78,222,163,0.8)] border-2 border-[#191c21]"></div>
              {/* Node 2: Tender Cutoff */}
              <div className="absolute left-[70%] -top-1 w-3 h-3 rounded-full bg-[#ffd58d] border-2 border-[#191c21]"></div>
              {/* Node 3: Expiry Final */}
              <div className="absolute right-0 -top-1 w-3 h-3 rounded-full bg-[#ffb4ab] border-2 border-[#191c21]"></div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-[#1d2025] p-2 rounded border border-[#272a30]">
                <span className="text-label-mono-micro text-[#4edea3] block font-bold">
                  T-5 TRADING DAYS
                </span>
                <span className="text-headline-sm text-[#e1e2ea] font-bold">AUG ROLL</span>
                <span className="text-body-sm text-[#9b8f7f] block">Roll Efficiency 98.4%</span>
              </div>
              <div className="bg-[#1d2025] p-2 rounded border border-[#272a30]">
                <span className="text-label-mono-micro text-[#ffd58d] block font-bold">
                  26 JUL 2024
                </span>
                <span className="text-headline-sm text-[#e1e2ea] font-bold">TENDER CUT</span>
                <span className="text-body-sm text-[#9b8f7f] block">Compulsory Delivery</span>
              </div>
              <div className="bg-[#1d2025] p-2 rounded border border-[#272a30]">
                <span className="text-label-mono-micro text-[#ffb4ab] block font-bold">
                  05 AUG 2024
                </span>
                <span className="text-headline-sm text-[#e1e2ea] font-bold">FINAL EXPIRY</span>
                <span className="text-body-sm text-[#9b8f7f] block">Warehouse Settlement</span>
              </div>
            </div>
          </div>

          {/* Vault Delivery Liquidity Notes */}
          <div
            onClick={onOpenVaultModal}
            className="flex items-center justify-between pt-2 text-[#d2c5b3] text-body-sm cursor-pointer hover:bg-[#272a30]/40 p-1 rounded transition-colors"
          >
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-[#b2e1ff]">
                inventory_2
              </span>
              <span>
                Ahmedabad Vault Demat Stock:{' '}
                <strong className="text-[#e1e2ea] font-mono">4,120 kg</strong>
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[#4edea3] font-mono text-[11px] font-semibold">
                Adequate Cover
              </span>
              <span className="material-symbols-outlined text-[14px] text-[#9b8f7f]">
                chevron_right
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Quick Scenario Simulator Drawer / Bar */}
      <div className="px-3 sm:px-4 mb-2">
        <div className="bg-[#272a30] rounded-xl p-2.5 sm:p-3 shadow-lg border border-[#32353b]">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#ffd58d] text-[18px]">tune</span>
              <span className="text-headline-sm text-[#ffd58d] tracking-tight font-bold">
                Macro Rate Shift Simulator
              </span>
            </div>
            <span className="text-label-mono-micro text-[#d2c5b3] font-mono">DELTA TEST</span>
          </div>
          <p className="text-body-sm text-[#d2c5b3] mb-2 leading-relaxed">
            Assess interest rate shock propagation across forward contango carry slopes and
            fair-value theoretical pricing.
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setRateShockBps(-50)}
              className={`flex-1 min-h-[44px] py-1.5 px-2 rounded text-label-mono-micro font-semibold active:scale-95 transition-all text-center border cursor-pointer ${
                rateShockBps === -50
                  ? 'bg-[#1d2025] border-[#4edea3] text-white shadow-sm'
                  : 'bg-[#1d2025] border-[#32353b] text-[#e1e2ea] hover:bg-[#32353b]'
              }`}
            >
              -50bps CUT
              <br />
              <span className="text-[#4edea3] font-mono">Theo Gap -₹45</span>
            </button>

            <button
              onClick={() => setRateShockBps(50)}
              className={`flex-1 min-h-[44px] py-1.5 px-2 rounded text-label-mono-micro font-bold active:scale-95 transition-all text-center border cursor-pointer ${
                rateShockBps === 50
                  ? 'bg-[#e5b869] text-[#674800] border-[#ffd58d] shadow-md'
                  : 'bg-[#e5b869]/80 text-[#674800] border-transparent hover:bg-[#e5b869]'
              }`}
            >
              +50bps HIKE
              <br />
              <span className="text-[#674800]/90 font-mono">Theo Gap +₹45</span>
            </button>

            <button
              onClick={() => setRateShockBps(0)}
              title="Reset rate shock"
              className="min-h-[44px] w-11 flex items-center justify-center rounded bg-[#1d2025] border border-[#32353b] text-[#9b8f7f] hover:text-[#e1e2ea] active:scale-95 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">restart_alt</span>
            </button>
          </div>

          {/* Realtime Impact Output Banner */}
          <div className="mt-2 p-2 rounded bg-[#0b0e13] flex items-center justify-between border border-[#1d2025]">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#4edea3]">insights</span>
              <span className="text-body-sm text-[#e1e2ea]">
                {rateShockBps === 0 ? (
                  <>
                    Baseline MIBOR: <strong className="font-mono">6.75%</strong>
                  </>
                ) : (
                  <>
                    Simulated Rate:{' '}
                    <strong
                      className={`font-mono ${
                        rateShockBps > 0 ? 'text-[#ffd58d]' : 'text-[#4edea3]'
                      }`}
                    >
                      {simulatedMibor.toFixed(2)}% ({rateShockBps > 0 ? `+${rateShockBps}` : rateShockBps}bps)
                    </strong>
                  </>
                )}
              </span>
            </div>
            <span
              className={`text-label-numeric-sm font-bold ${
                rateShockBps > 0
                  ? 'text-[#ffd58d]'
                  : rateShockBps < 0
                  ? 'text-[#4edea3]'
                  : 'text-[#4edea3]'
              }`}
            >
              {rateShockBps === 0
                ? 'OCT-DEC ARB: +₹160'
                : rateShockBps > 0
                ? `OCT-DEC ARB: +₹${simulatedNetEdge} (Narrowing)`
                : `OCT-DEC ARB: +₹${simulatedNetEdge} (Widening)`}
            </span>
          </div>
        </div>
      </div>

      {/* Tactical Execution Bar Footer */}
      <div className="px-3 sm:px-4 pt-1">
        <div className="bg-[#1d2025] rounded-lg p-2.5 flex items-center justify-between gap-2 shadow-md border border-[#272a30]">
          <div className="flex flex-col">
            <span className="text-label-mono-micro text-[#9b8f7f] uppercase">
              Active Selection
            </span>
            <span className="text-headline-sm text-[#e1e2ea] font-bold">
              {selectedPair.nearLeg}/{selectedPair.farLeg.slice(0, 3)} RV ROLL
            </span>
            <span className="text-label-numeric-sm text-[#4edea3] font-mono">
              Net Edge: +₹{selectedPair.lotValueEdge.toLocaleString('en-IN')}/Lot
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenExecution('BUY_SPREAD')}
              className="min-h-[44px] px-3 py-2 rounded bg-[#93000a]/30 border border-[#ffb4ab]/40 text-[#ffb4ab] hover:bg-[#93000a]/50 text-label-mono-micro font-bold uppercase active:scale-95 transition-transform flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">trending_down</span>
              Buy Arb
            </button>
            <button
              onClick={() => onOpenExecution('SELL_SPREAD')}
              className="min-h-[44px] px-3.5 py-2 rounded bg-[#4edea3] hover:bg-[#6ffbbe] text-[#003824] text-label-mono-micro font-bold uppercase active:scale-95 transition-transform shadow-[0_0_12px_rgba(78,222,163,0.3)] flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">trending_up</span>
              Sell Arb
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
