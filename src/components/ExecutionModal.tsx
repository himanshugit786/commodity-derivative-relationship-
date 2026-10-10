import React, { useState } from 'react';
import { CalendarPair, OpenSpreadPosition } from '../types/arbitrage';

interface ExecutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  pair: CalendarPair;
  initialDirection: 'BUY_SPREAD' | 'SELL_SPREAD';
  onExecuteTrade: (position: Omit<OpenSpreadPosition, 'id' | 'openDate'>) => void;
}

export const ExecutionModal: React.FC<ExecutionModalProps> = ({
  isOpen,
  onClose,
  pair,
  initialDirection,
  onExecuteTrade,
}) => {
  const [direction, setDirection] = useState<'BUY_SPREAD' | 'SELL_SPREAD'>(initialDirection);
  const [lots, setLots] = useState<number>(5);
  const [orderType, setOrderType] = useState<'LIMIT' | 'MARKET' | 'IOC'>('LIMIT');
  const [slippageTolerance, setSlippageTolerance] = useState<number>(2);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // 1 Lot of MCX Gold is 1 kg (1000 grams = 100 units of 10g quotation)
  const lotSizeGrams = 1000;
  const unitFactor = lotSizeGrams / 10; // 100 multiplier
  const netEdgePerLot = pair.netArbEdge * unitFactor; // e.g. 160 * 100 = 16,000 INR
  const totalNetEdge = netEdgePerLot * lots;

  // Margin calculation with MCX 75% calendar spread hedge relief
  // Naked 1kg gold margin is ~₹13.5 Lakhs; Spread margin is ~₹3.4 Lakhs per spread lot
  const marginPerLot = 340000;
  const totalMarginRequired = marginPerLot * lots;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessMessage(`Order Filled! Routed ${lots} Lots on MCX Spread Book`);

      onExecuteTrade({
        pairId: pair.id,
        direction,
        nearLeg: pair.nearLeg,
        farLeg: pair.farLeg,
        nearEntryPrice: pair.nearPrice,
        farEntryPrice: pair.farPrice,
        entrySpread: pair.grossSpread,
        currentSpread: pair.grossSpread,
        lots,
        lotSizeKg: 1,
        unrealizedPnl: 0,
        marginUsed: totalMarginRequired,
        zScoreAtEntry: pair.zScore,
        currentZScore: pair.zScore,
        daysToTender: pair.holdingDays,
      });

      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1200);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#191c21] border border-[#32353b] rounded-t-2xl sm:rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Drawer Header */}
        <div className="p-4 border-b border-[#272a30] flex items-center justify-between bg-[#111319]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse"></span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-headline-sm text-[#e1e2ea] font-bold">
                  {pair.id.replace('-', ' / ')}
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#ffd58d]/20 text-[#ffd58d]">
                  RV ROLL
                </span>
              </div>
              <span className="text-body-sm text-[#9b8f7f]">
                Dual-Leg MCX Calendar Spread Engine
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded flex items-center justify-center text-[#9b8f7f] hover:text-[#e1e2ea] hover:bg-[#272a30] transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {successMessage ? (
          <div className="p-8 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-14 h-14 rounded-full bg-[#4edea3]/20 text-[#4edea3] flex items-center justify-center">
              <span className="material-symbols-outlined text-[32px]">check_circle</span>
            </div>
            <h4 className="text-headline-sm text-[#e1e2ea]">{successMessage}</h4>
            <p className="text-body-sm text-[#9b8f7f]">
              Synthesizing spread positions in portfolio desk...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto">
            {/* Direction Selector */}
            <div className="grid grid-cols-2 gap-2 bg-[#111319] p-1 rounded-lg border border-[#272a30]">
              <button
                type="button"
                onClick={() => setDirection('SELL_SPREAD')}
                className={`py-2 px-3 rounded flex flex-col items-center justify-center transition-all ${
                  direction === 'SELL_SPREAD'
                    ? 'bg-[#4edea3] text-[#003824] font-bold shadow-md'
                    : 'text-[#d2c5b3] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">trending_up</span>
                  <span className="text-xs uppercase font-mono font-bold">SELL SPREAD (SHORT ARB)</span>
                </div>
                <span className="text-[10px] opacity-80">Sell Far / Buy Near (+₹160 Rich)</span>
              </button>

              <button
                type="button"
                onClick={() => setDirection('BUY_SPREAD')}
                className={`py-2 px-3 rounded flex flex-col items-center justify-center transition-all ${
                  direction === 'BUY_SPREAD'
                    ? 'bg-[#ffb4ab] text-[#690005] font-bold shadow-md'
                    : 'text-[#d2c5b3] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">trending_down</span>
                  <span className="text-xs uppercase font-mono font-bold">BUY SPREAD (LONG ARB)</span>
                </div>
                <span className="text-[10px] opacity-80">Buy Far / Sell Near</span>
              </button>
            </div>

            {/* Split Leg Specifications Card */}
            <div className="bg-[#111319] p-3 rounded-lg border border-[#272a30] space-y-2">
              <div className="flex items-center justify-between text-xs text-[#9b8f7f] border-b border-[#272a30] pb-1.5 font-mono">
                <span>LEG BREAKDOWN (1 KG STANDARD)</span>
                <span>STATUS: LINKED ATOMIC</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {/* Leg 1 */}
                <div className="p-2 rounded bg-[#191c21] border border-[#272a30]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#ffd58d] font-bold font-mono">{pair.nearLeg}</span>
                    <span
                      className={`text-[10px] px-1 rounded font-mono font-bold ${
                        direction === 'SELL_SPREAD'
                          ? 'bg-[#4edea3]/20 text-[#4edea3]'
                          : 'bg-[#ffb4ab]/20 text-[#ffb4ab]'
                      }`}
                    >
                      {direction === 'SELL_SPREAD' ? 'BUY (LONG)' : 'SELL (SHORT)'}
                    </span>
                  </div>
                  <div className="text-label-numeric-md text-[#e1e2ea] font-mono mt-1 font-bold">
                    ₹{pair.nearPrice.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-[#9b8f7f]">Near Month Node</span>
                </div>

                {/* Leg 2 */}
                <div className="p-2 rounded bg-[#191c21] border border-[#272a30]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#7bd0ff] font-bold font-mono">{pair.farLeg}</span>
                    <span
                      className={`text-[10px] px-1 rounded font-mono font-bold ${
                        direction === 'SELL_SPREAD'
                          ? 'bg-[#ffb4ab]/20 text-[#ffb4ab]'
                          : 'bg-[#4edea3]/20 text-[#4edea3]'
                      }`}
                    >
                      {direction === 'SELL_SPREAD' ? 'SELL (SHORT)' : 'BUY (LONG)'}
                    </span>
                  </div>
                  <div className="text-label-numeric-md text-[#e1e2ea] font-mono mt-1 font-bold">
                    ₹{pair.farPrice.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-[#9b8f7f]">Far Month Node</span>
                </div>
              </div>

              {/* Net Spread Summary */}
              <div className="flex items-center justify-between pt-1 px-1 text-xs">
                <span className="text-[#9b8f7f]">Gross Spread Basis:</span>
                <span className="text-label-numeric-sm text-[#ffd58d] font-bold">
                  +₹{pair.grossSpread} ({pair.grossSpreadBps} bps)
                </span>
              </div>
            </div>

            {/* Lot Size Quantum Stepper */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-[#d2c5b3] font-mono uppercase">
                  Contract Lots (1 Lot = 1,000g)
                </label>
                <span className="text-xs text-[#ffd58d] font-mono font-bold">
                  {lots * 1} kg Physical Gold
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLots(Math.max(1, lots - 1))}
                  className="w-11 h-10 rounded bg-[#272a30] hover:bg-[#32353b] text-[#e1e2ea] font-bold flex items-center justify-center active:scale-95 transition-all text-lg"
                >
                  -
                </button>
                <div className="flex-1 h-10 bg-[#111319] border border-[#32353b] focus-within:border-[#ffd58d] rounded flex items-center justify-center font-mono font-bold text-lg text-[#e1e2ea]">
                  {lots}
                </div>
                <button
                  type="button"
                  onClick={() => setLots(lots + 1)}
                  className="w-11 h-10 rounded bg-[#272a30] hover:bg-[#32353b] text-[#e1e2ea] font-bold flex items-center justify-center active:scale-95 transition-all text-lg"
                >
                  +
                </button>
              </div>

              {/* Quick Lot Presets */}
              <div className="flex items-center gap-1.5 mt-2">
                {[1, 5, 10, 25, 50].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setLots(preset)}
                    className={`flex-1 py-1 rounded text-xs font-mono transition-colors ${
                      lots === preset
                        ? 'bg-[#ffd58d] text-[#422c00] font-bold'
                        : 'bg-[#272a30] text-[#d2c5b3] hover:text-white'
                    }`}
                  >
                    {preset}L
                  </button>
                ))}
              </div>
            </div>

            {/* Order Type & Slippage */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-[#9b8f7f] block mb-1 uppercase font-mono">
                  Execution Mode
                </label>
                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value as any)}
                  className="w-full h-9 bg-[#111319] border border-[#272a30] rounded px-2 text-xs font-mono text-[#e1e2ea] focus:outline-none focus:border-[#ffd58d]"
                >
                  <option value="LIMIT">LIMIT (Spread Book)</option>
                  <option value="MARKET">MARKET (Dual Fill)</option>
                  <option value="IOC">IOC (Immediate Or Cancel)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-[#9b8f7f] block mb-1 uppercase font-mono">
                  Slippage Limit
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSlippageTolerance(s)}
                      className={`flex-1 h-9 rounded text-xs font-mono transition-colors ${
                        slippageTolerance === s
                          ? 'bg-[#272a30] border border-[#ffd58d] text-[#ffd58d] font-bold'
                          : 'bg-[#111319] border border-[#272a30] text-[#9b8f7f]'
                      }`}
                    >
                      ±₹{s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Financial Telemetry Banner */}
            <div className="p-3 rounded-lg bg-[#111319] border border-[#272a30] space-y-1.5 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-[#9b8f7f]">Net Arbitrage Edge:</span>
                <span className="text-[#4edea3] font-bold">
                  +₹{totalNetEdge.toLocaleString('en-IN')} (₹{pair.netArbEdge}/10g)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#9b8f7f]">SPAN Margin (75% hedge):</span>
                <span className="text-[#e1e2ea]">
                  ₹{(totalMarginRequired / 100000).toFixed(2)} Lakhs
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#9b8f7f]">Holding Carry Cost:</span>
                <span className="text-[#d2c5b3]">
                  ₹{(pair.carryExpense * unitFactor * lots).toLocaleString('en-IN')} (6.75% ann.)
                </span>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full min-h-[48px] rounded font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg ${
                  direction === 'SELL_SPREAD'
                    ? 'bg-[#4edea3] hover:bg-[#6ffbbe] text-[#003824] shadow-[#4edea3]/20'
                    : 'bg-[#ffb4ab] hover:bg-[#ffdad6] text-[#690005] shadow-[#ffb4ab]/20'
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                    Routing via MCX OMS...
                  </span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">bolt</span>
                    <span>
                      Transmit {direction === 'SELL_SPREAD' ? 'Sell' : 'Buy'} Spread Order ({lots} Lots)
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
