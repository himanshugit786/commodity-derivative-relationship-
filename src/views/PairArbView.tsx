import React, { useState } from 'react';
import { CalendarPair } from '../types/arbitrage';

interface PairArbViewProps {
  selectedPair: CalendarPair;
  pairs: CalendarPair[];
  onSelectPair: (pair: CalendarPair) => void;
  onOpenExecution: (direction: 'BUY_SPREAD' | 'SELL_SPREAD') => void;
}

export const PairArbView: React.FC<PairArbViewProps> = ({
  selectedPair,
  pairs,
  onSelectPair,
  onOpenExecution,
}) => {
  const [quickLots, setQuickLots] = useState<number>(5);

  // Mock synthetic spread depth levels
  const spreadBids = [
    { spread: selectedPair.grossSpread - 1, lots: 18, totalLots: 18 },
    { spread: selectedPair.grossSpread - 2, lots: 34, totalLots: 52 },
    { spread: selectedPair.grossSpread - 3, lots: 65, totalLots: 117 },
    { spread: selectedPair.grossSpread - 4, lots: 92, totalLots: 209 },
  ];

  const spreadAsks = [
    { spread: selectedPair.grossSpread + 1, lots: 22, totalLots: 22 },
    { spread: selectedPair.grossSpread + 2, lots: 48, totalLots: 70 },
    { spread: selectedPair.grossSpread + 3, lots: 75, totalLots: 145 },
    { spread: selectedPair.grossSpread + 4, lots: 110, totalLots: 255 },
  ];

  // Recent synthetic spread trades
  const recentTrades = [
    { time: '14:28:44.102', spread: selectedPair.grossSpread, lots: 5, type: 'SELL' },
    { time: '14:28:39.810', spread: selectedPair.grossSpread, lots: 2, type: 'SELL' },
    { time: '14:28:22.404', spread: selectedPair.grossSpread - 1, lots: 10, type: 'BUY' },
    { time: '14:27:58.190', spread: selectedPair.grossSpread, lots: 8, type: 'SELL' },
  ];

  return (
    <div className="flex flex-col w-full pb-20">
      {/* Top Pair Header & Switcher */}
      <div className="px-3 sm:px-4 pt-1.5 pb-2">
        <div className="bg-[#191c21] rounded-xl p-3 border border-[#272a30]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#ffd58d] text-[20px]">
                candlestick_chart
              </span>
              <div>
                <h2 className="text-headline-sm text-[#e1e2ea] font-bold">
                  {selectedPair.nearLeg} - {selectedPair.farLeg}
                </h2>
                <span className="text-body-sm text-[#9b8f7f]">
                  Dual-Leg Synthetic Spread Ladder &amp; Z-Channel
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-label-numeric-lg text-[#4edea3] font-bold">
                +₹{selectedPair.grossSpread}
              </span>
              <span className="text-label-mono-micro text-[#9b8f7f] block font-mono">
                {selectedPair.grossSpreadBps} bps spread
              </span>
            </div>
          </div>

          {/* Quick Pair Selector Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {pairs.map((p) => (
              <button
                key={p.id}
                onClick={() => onSelectPair(p)}
                className={`px-2.5 py-1 rounded text-label-mono-micro font-mono font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  p.id === selectedPair.id
                    ? 'bg-[#ffd58d] text-[#422c00]'
                    : 'bg-[#272a30] text-[#d2c5b3] hover:text-white'
                }`}
              >
                {p.nearLeg.slice(0, 3)}/{p.farLeg.slice(0, 3)} ({p.zScore > 0 ? `+${p.zScore}σ` : `${p.zScore}σ`})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 30-Day Historical Z-Score Mean Reversion Channel */}
      <div className="px-3 sm:px-4 mb-2">
        <div className="bg-[#191c21] rounded-xl p-3 border border-[#272a30]">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#6ffbbe] text-[18px]">
                show_chart
              </span>
              <span className="text-headline-sm text-[#e1e2ea] font-bold">
                30-Day Spread Z-Score Channel
              </span>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-[#4edea3]/20 text-[#4edea3] text-label-mono-micro font-bold">
              +2.38σ STAT ARB
            </span>
          </div>

          <p className="text-body-sm text-[#9b8f7f] mb-2">
            Historical spread distribution: Mean = ₹610 | 1σ = ₹67 | Current Spread = ₹770 (+2.38σ)
          </p>

          {/* Graphical Z-Score Channel SVG */}
          <div className="w-full h-36 bg-[#0b0e13] rounded-lg p-2 relative overflow-hidden border border-[#272a30]">
            <svg
              className="w-full h-full"
              preserveAspectRatio="none"
              viewBox="0 0 320 120"
            >
              <defs>
                <linearGradient id="zFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#4edea3" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#4edea3" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Upper boundary line +2σ */}
              <line stroke="#ffb4ab" strokeDasharray="3,3" strokeWidth="1" x1="10" x2="310" y1="28" y2="28" />
              <text fill="#ffb4ab" fontSize="8" fontFamily="JetBrains Mono" x="12" y="24">
                +2.0σ SELL ZONE
              </text>

              {/* Mean Line (0σ) */}
              <line stroke="#9b8f7f" strokeWidth="1" x1="10" x2="310" y1="65" y2="65" />
              <text fill="#9b8f7f" fontSize="8" fontFamily="JetBrains Mono" x="12" y="62">
                0σ FAIR MEAN (₹610)
              </text>

              {/* Lower boundary line -2σ */}
              <line stroke="#7bd0ff" strokeDasharray="3,3" strokeWidth="1" x1="10" x2="310" y1="102" y2="102" />
              <text fill="#7bd0ff" fontSize="8" fontFamily="JetBrains Mono" x="12" y="112">
                -2.0σ BUY ZONE
              </text>

              {/* Historical Spread trajectory path */}
              <path
                d="M 15,68 Q 45,55 75,62 T 135,74 T 195,50 T 255,38 T 300,20"
                fill="none"
                stroke="#ffd58d"
                strokeWidth="2"
              />

              {/* Current Spot Node at +2.38σ */}
              <circle cx="300" cy="20" fill="#4edea3" r="5" />
              <circle cx="300" cy="20" fill="none" stroke="#4edea3" strokeWidth="2" r="8" className="animate-ping" />
            </svg>

            {/* Float callout */}
            <div className="absolute top-2 right-2 bg-[#191c21]/90 border border-[#4edea3] rounded px-2 py-0.5 text-right font-mono">
              <span className="text-[10px] text-[#4edea3] font-bold block">+2.38σ PEAK</span>
              <span className="text-[9px] text-[#9b8f7f]">89% Reversion Prob</span>
            </div>
          </div>
        </div>
      </div>

      {/* Synthetic Spread Depth Ladder */}
      <div className="px-3 sm:px-4 mb-2">
        <div className="bg-[#191c21] rounded-xl p-3 border border-[#272a30]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-headline-sm text-[#e1e2ea] font-bold">
              Spread Order Book Depth
            </span>
            <span className="text-label-mono-micro text-[#d2c5b3] font-mono">
              TICK SIZE: ₹1.00 / 10g
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            {/* Bid Depth (Buyers of Spread) */}
            <div className="bg-[#111319] p-2 rounded border border-[#272a30]">
              <div className="flex items-center justify-between text-[#9b8f7f] text-[10px] border-b border-[#272a30] pb-1 mb-1">
                <span>TOTAL</span>
                <span>LOTS</span>
                <span className="text-[#4edea3]">BID SPREAD</span>
              </div>
              <div className="space-y-1">
                {spreadBids.map((b, i) => (
                  <div key={i} className="flex items-center justify-between relative overflow-hidden py-0.5">
                    <div
                      className="absolute right-0 top-0 bottom-0 bg-[#4edea3]/10"
                      style={{ width: `${(b.lots / 100) * 100}%` }}
                    ></div>
                    <span className="text-[#9b8f7f] text-[10px]">{b.totalLots}</span>
                    <span className="text-[#e1e2ea] font-bold">{b.lots}L</span>
                    <span className="text-[#4edea3] font-bold">+₹{b.spread}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ask Depth (Sellers of Spread) */}
            <div className="bg-[#111319] p-2 rounded border border-[#272a30]">
              <div className="flex items-center justify-between text-[#9b8f7f] text-[10px] border-b border-[#272a30] pb-1 mb-1">
                <span className="text-[#ffb4ab]">ASK SPREAD</span>
                <span>LOTS</span>
                <span>TOTAL</span>
              </div>
              <div className="space-y-1">
                {spreadAsks.map((a, i) => (
                  <div key={i} className="flex items-center justify-between relative overflow-hidden py-0.5">
                    <div
                      className="absolute left-0 top-0 bottom-0 bg-[#ffb4ab]/10"
                      style={{ width: `${(a.lots / 120) * 100}%` }}
                    ></div>
                    <span className="text-[#ffb4ab] font-bold">+₹{a.spread}</span>
                    <span className="text-[#e1e2ea] font-bold">{a.lots}L</span>
                    <span className="text-[#9b8f7f] text-[10px]">{a.totalLots}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Trades Tape */}
          <div className="mt-2 pt-2 border-t border-[#272a30]">
            <div className="flex items-center justify-between text-[11px] text-[#9b8f7f] font-mono mb-1">
              <span>RECENT SPREAD PRINTS</span>
              <span>OMS TICK STREAM</span>
            </div>
            <div className="space-y-1 font-mono text-xs">
              {recentTrades.map((t, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px]">
                  <span className="text-[#9b8f7f]">{t.time}</span>
                  <span className="text-[#e1e2ea] font-bold">{t.lots} Lots</span>
                  <span className={t.type === 'SELL' ? 'text-[#4edea3]' : 'text-[#ffb4ab]'}>
                    @ +₹{t.spread} ({t.type})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Quantum Lot Order Strip */}
      <div className="px-3 sm:px-4">
        <div className="bg-[#1d2025] rounded-xl p-3 border border-[#272a30] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#9b8f7f] uppercase">
              Fast Execution Preset
            </span>
            <div className="flex items-center gap-1 font-mono text-xs">
              {[1, 5, 10, 20].map((l) => (
                <button
                  key={l}
                  onClick={() => setQuickLots(l)}
                  className={`px-2 py-0.5 rounded ${
                    quickLots === l
                      ? 'bg-[#ffd58d] text-[#422c00] font-bold'
                      : 'bg-[#111319] text-[#d2c5b3]'
                  }`}
                >
                  {l}L
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onOpenExecution('BUY_SPREAD')}
              className="py-2.5 rounded bg-[#93000a]/30 border border-[#ffb4ab]/40 text-[#ffb4ab] hover:bg-[#93000a]/50 text-xs font-mono font-bold uppercase transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">trending_down</span>
              Buy Spread ({quickLots}L)
            </button>
            <button
              onClick={() => onOpenExecution('SELL_SPREAD')}
              className="py-2.5 rounded bg-[#4edea3] hover:bg-[#6ffbbe] text-[#003824] text-xs font-mono font-bold uppercase transition-all flex items-center justify-center gap-1 cursor-pointer shadow-md"
            >
              <span className="material-symbols-outlined text-[16px]">trending_up</span>
              Sell Spread ({quickLots}L)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
