import React, { useState } from 'react';
import { OpenSpreadPosition } from '../types/arbitrage';

interface PositionsViewProps {
  positions: OpenSpreadPosition[];
  onSquareOff: (positionId: string) => void;
  onRollPosition: (positionId: string) => void;
  onOpenExecution: () => void;
}

export const PositionsView: React.FC<PositionsViewProps> = ({
  positions,
  onSquareOff,
  onRollPosition,
  onOpenExecution,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'TENDER_RISK'>('ALL');

  // Portfolio calculations
  const totalPnl = positions.reduce((acc, pos) => acc + pos.unrealizedPnl, 0);
  const totalMarginUsed = positions.reduce((acc, pos) => acc + pos.marginUsed, 0);
  const totalCapitalAllocated = 6500000; // 65 Lakhs
  const marginUtilizationPct = ((totalMarginUsed / totalCapitalAllocated) * 100).toFixed(1);

  const filteredPositions = positions.filter((pos) => {
    if (filter === 'ACTIVE') return pos.lots > 0;
    if (filter === 'TENDER_RISK') return pos.daysToTender <= 5;
    return true;
  });

  return (
    <div className="flex flex-col w-full pb-20">
      {/* Portfolio Desk Summary KPIs */}
      <div className="px-3 sm:px-4 pt-1.5 pb-2">
        <div className="bg-[#191c21] rounded-xl p-3 border border-[#272a30]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#ffd58d] text-[20px]">
                account_balance_wallet
              </span>
              <div>
                <h2 className="text-headline-sm text-[#e1e2ea] font-bold">
                  Calendar Book &amp; Risk
                </h2>
                <span className="text-body-sm text-[#9b8f7f]">
                  Active Multi-Leg Arbitrage Portfolio
                </span>
              </div>
            </div>

            <button
              onClick={onOpenExecution}
              className="px-2.5 py-1 rounded bg-[#ffd58d] hover:bg-[#ffdea9] text-[#422c00] font-mono text-xs font-bold uppercase transition-all"
            >
              + New Spread
            </button>
          </div>

          {/* 3 Summary Badges */}
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div className="p-2 rounded bg-[#111319] border border-[#272a30]">
              <span className="text-label-mono-micro text-[#9b8f7f] block">UNREALIZED MTM</span>
              <span
                className={`text-label-numeric-md font-bold ${
                  totalPnl >= 0 ? 'text-[#4edea3]' : 'text-[#ffb4ab]'
                }`}
              >
                {totalPnl >= 0 ? `+₹${totalPnl.toLocaleString('en-IN')}` : `-₹${Math.abs(totalPnl).toLocaleString('en-IN')}`}
              </span>
              <span className="text-label-mono-micro text-[#4edea3] block">+14.2% ROC</span>
            </div>

            <div className="p-2 rounded bg-[#111319] border border-[#272a30]">
              <span className="text-label-mono-micro text-[#9b8f7f] block">MARGIN USED</span>
              <span className="text-label-numeric-md text-[#ffd58d] font-bold">
                ₹{(totalMarginUsed / 100000).toFixed(1)}L
              </span>
              <span className="text-label-mono-micro text-[#9b8f7f] block">
                {marginUtilizationPct}% of ₹65L
              </span>
            </div>

            <div className="p-2 rounded bg-[#111319] border border-[#272a30]">
              <span className="text-label-mono-micro text-[#9b8f7f] block">PORTFOLIO VaR</span>
              <span className="text-label-numeric-md text-[#7bd0ff] font-bold">₹18,400</span>
              <span className="text-label-mono-micro text-[#9b8f7f] block">99% 1-Day</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-3 sm:px-4 mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1 bg-[#1d2025] p-0.5 rounded border border-[#272a30]">
          {(['ALL', 'ACTIVE', 'TENDER_RISK'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-2 py-1 rounded text-label-mono-micro font-mono font-bold transition-all ${
                filter === tab
                  ? 'bg-[#ffd58d] text-[#422c00]'
                  : 'text-[#9b8f7f] hover:text-[#e1e2ea]'
              }`}
            >
              {tab === 'TENDER_RISK' ? 'TENDER ALERTS' : tab}
            </button>
          ))}
        </div>
        <span className="text-[11px] text-[#9b8f7f] font-mono">
          {filteredPositions.length} Spread Positions
        </span>
      </div>

      {/* Positions List */}
      <div className="px-3 sm:px-4 space-y-2">
        {filteredPositions.length === 0 ? (
          <div className="p-8 text-center bg-[#191c21] rounded-xl border border-[#272a30] text-[#9b8f7f] font-mono text-xs">
            No active positions found in this filter view.
          </div>
        ) : (
          filteredPositions.map((pos) => {
            const isTenderRisk = pos.daysToTender <= 5;
            return (
              <div
                key={pos.id}
                className={`bg-[#1d2025] rounded-xl p-3 border transition-all ${
                  isTenderRisk ? 'border-[#ffb4ab]/60' : 'border-[#272a30]'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-1.5 border-b border-[#272a30]">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                        pos.direction === 'SELL_SPREAD'
                          ? 'bg-[#4edea3]/20 text-[#4edea3]'
                          : 'bg-[#ffb4ab]/20 text-[#ffb4ab]'
                      }`}
                    >
                      {pos.direction === 'SELL_SPREAD' ? 'SHORT ARB' : 'LONG ARB'}
                    </span>
                    <span className="text-headline-sm text-[#e1e2ea] font-bold">
                      {pos.nearLeg} - {pos.farLeg}
                    </span>
                    <span className="text-xs font-mono text-[#ffd58d]">({pos.lots} Lots)</span>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-label-numeric-md font-bold ${
                        pos.unrealizedPnl >= 0 ? 'text-[#4edea3]' : 'text-[#ffb4ab]'
                      }`}
                    >
                      {pos.unrealizedPnl >= 0
                        ? `+₹${pos.unrealizedPnl.toLocaleString('en-IN')}`
                        : `-₹${Math.abs(pos.unrealizedPnl).toLocaleString('en-IN')}`}
                    </span>
                  </div>
                </div>

                {/* Tender Alert Banner if <= 5 days */}
                {isTenderRisk && (
                  <div className="my-2 p-1.5 bg-[#93000a]/20 border border-[#ffb4ab]/40 rounded flex items-center justify-between text-[11px] font-mono text-[#ffb4ab]">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">warning</span>
                      Near leg enters tender in {pos.daysToTender} days!
                    </span>
                    <span className="font-bold underline cursor-pointer" onClick={() => onRollPosition(pos.id)}>
                      ROLL NOW
                    </span>
                  </div>
                )}

                {/* Data Grid */}
                <div className="grid grid-cols-4 gap-2 my-2 py-1 bg-[#111319] p-2 rounded text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-[#9b8f7f] block">ENTRY SPREAD</span>
                    <span className="text-[#e1e2ea] font-bold">₹{pos.entrySpread}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#9b8f7f] block">CURRENT</span>
                    <span className="text-[#ffd58d] font-bold">₹{pos.currentSpread}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#9b8f7f] block">ENTRY Z-SCORE</span>
                    <span className="text-[#e1e2ea] font-bold">+{pos.zScoreAtEntry}σ</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#9b8f7f] block">MARGIN USED</span>
                    <span className="text-[#7bd0ff] font-bold">
                      ₹{(pos.marginUsed / 100000).toFixed(1)}L
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-1 gap-2">
                  <span className="text-[11px] text-[#9b8f7f] font-mono">
                    Opened: {pos.openDate} | ID: {pos.id}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onRollPosition(pos.id)}
                      className="px-2.5 py-1 rounded bg-[#272a30] hover:bg-[#32353b] text-[#ffd58d] text-xs font-mono font-bold transition-colors"
                    >
                      Roll Next
                    </button>
                    <button
                      onClick={() => onSquareOff(pos.id)}
                      className="px-2.5 py-1 rounded bg-[#93000a]/30 hover:bg-[#93000a]/50 text-[#ffb4ab] text-xs font-mono font-bold transition-colors"
                    >
                      Square Off
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
