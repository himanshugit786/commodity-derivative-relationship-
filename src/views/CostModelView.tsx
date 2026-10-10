import React, { useState } from 'react';
import { CostModelParams, TenorContract } from '../types/arbitrage';

interface CostModelViewProps {
  tenors: TenorContract[];
  initialParams: CostModelParams;
}

export const CostModelView: React.FC<CostModelViewProps> = ({ tenors, initialParams }) => {
  const [params, setParams] = useState<CostModelParams>(initialParams);

  // Total annualized interest rate
  const totalInterestRate = params.miborRate + params.deskBorrowSpreadBps / 100;

  // Calculate theoretical forward price for a contract given days
  const calculateTheo = (spot: number, days: number) => {
    // 1. Financing cost: Spot * Rate * (days / 365)
    const financingCost = spot * (totalInterestRate / 100) * (days / 365);

    // 2. Storage Demat cost: rate per 100g/day * 0.1 (for 10g unit) * days
    const storageCostPer10g = (params.vaultStoragePer100gPerDay / 10) * days;

    // 3. Transit insurance & turnover: spot * insurancePct * (days/365)
    const insuranceCost = spot * (params.transitInsurancePct / 100) * (days / 365);

    // Theoretical forward
    const totalCarry = financingCost + storageCostPer10g + insuranceCost;
    return {
      fairPrice: Math.round(spot + totalCarry),
      totalCarry: Math.round(totalCarry),
      financingCost: Math.round(financingCost),
      storageCost: Math.round(storageCostPer10g),
      insuranceCost: Math.round(insuranceCost),
    };
  };

  const octTheo = calculateTheo(params.spotPrice, 65);
  const decTheo = calculateTheo(params.spotPrice, 127);
  const febTheo = calculateTheo(params.spotPrice, 189);

  return (
    <div className="flex flex-col w-full pb-20">
      {/* View Header */}
      <div className="px-3 sm:px-4 pt-1.5 pb-2">
        <div className="bg-[#191c21] rounded-xl p-3 border border-[#272a30]">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#ffd58d] text-[20px]">
                calculate
              </span>
              <div>
                <h2 className="text-headline-sm text-[#e1e2ea] font-bold">
                  Cash-and-Carry Cost Engine
                </h2>
                <span className="text-body-sm text-[#9b8f7f]">
                  Theoretical MCX Term Structure Decomposer
                </span>
              </div>
            </div>
            <button
              onClick={() => setParams(initialParams)}
              className="text-label-mono-micro text-[#ffd58d] hover:underline font-mono"
            >
              RESET DEFAULTS
            </button>
          </div>

          {/* Pricing Formula Callout */}
          <div className="p-2.5 rounded bg-[#111319] border border-[#272a30] text-xs font-mono text-[#d2c5b3] mt-2">
            <div className="text-[#ffd58d] font-bold text-[11px] mb-1">
              THEORETICAL FORWARD VALUATION FORMULA:
            </div>
            <div className="text-xs text-[#e1e2ea]">
              F(t) = S₀ × [1 + (r_MIBOR + s_borrow) × (t/365)] + VaultStorage(t) + TransitInsurance(t)
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Parameter Sensitivity Sliders */}
      <div className="px-3 sm:px-4 mb-2">
        <div className="bg-[#191c21] rounded-xl p-3 border border-[#272a30] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-headline-sm text-[#e1e2ea] font-bold">
              Parameter Sensitivity Inputs
            </span>
            <span className="text-label-mono-micro text-[#4edea3] font-mono">
              TOTAL BORROW: {totalInterestRate.toFixed(2)}% p.a.
            </span>
          </div>

          {/* Slider 1: MIBOR Rate */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#9b8f7f]">Benchmark Overnight MIBOR:</span>
              <span className="text-[#ffd58d] font-bold">{params.miborRate.toFixed(2)}% p.a.</span>
            </div>
            <input
              type="range"
              min="4.0"
              max="9.5"
              step="0.05"
              value={params.miborRate}
              onChange={(e) => setParams({ ...params, miborRate: parseFloat(e.target.value) })}
              className="w-full accent-[#ffd58d] h-1.5 bg-[#272a30] rounded cursor-pointer"
            />
          </div>

          {/* Slider 2: Desk Borrow Spread */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#9b8f7f]">Desk Liquidity Spread over MIBOR:</span>
              <span className="text-[#7bd0ff] font-bold">+{params.deskBorrowSpreadBps} bps</span>
            </div>
            <input
              type="range"
              min="0"
              max="150"
              step="5"
              value={params.deskBorrowSpreadBps}
              onChange={(e) =>
                setParams({ ...params, deskBorrowSpreadBps: parseInt(e.target.value) })
              }
              className="w-full accent-[#7bd0ff] h-1.5 bg-[#272a30] rounded cursor-pointer"
            />
          </div>

          {/* Slider 3: Demat Vault Storage Fee */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#9b8f7f]">Vault Demat Storage Cost:</span>
              <span className="text-[#e1e2ea] font-bold">
                ₹{params.vaultStoragePer100gPerDay.toFixed(2)} / 100g / day
              </span>
            </div>
            <input
              type="range"
              min="1.0"
              max="7.0"
              step="0.25"
              value={params.vaultStoragePer100gPerDay}
              onChange={(e) =>
                setParams({ ...params, vaultStoragePer100gPerDay: parseFloat(e.target.value) })
              }
              className="w-full accent-[#4edea3] h-1.5 bg-[#272a30] rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Tenor Term Structure Fair Value Table */}
      <div className="px-3 sm:px-4 mb-2">
        <div className="bg-[#191c21] rounded-xl p-3 border border-[#272a30]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-headline-sm text-[#e1e2ea] font-bold">
              Tenor Theoretical vs Market Matrix
            </span>
            <span className="text-label-mono-micro text-[#d2c5b3] font-mono">
              SPOT: ₹{params.spotPrice.toLocaleString('en-IN')}/10g
            </span>
          </div>

          <div className="space-y-2">
            {/* AUG24 Prompt Spot */}
            <div className="p-2.5 rounded bg-[#111319] border border-[#272a30] flex items-center justify-between text-xs font-mono">
              <div>
                <span className="text-[#ffd58d] font-bold block">AUG24 (Prompt Anchor)</span>
                <span className="text-[10px] text-[#9b8f7f]">Maturity: 5 Days</span>
              </div>
              <div className="text-right">
                <span className="text-[#e1e2ea] font-bold">₹71,840</span>
                <span className="text-[10px] text-[#4edea3] block">Anchor Base</span>
              </div>
            </div>

            {/* OCT24 */}
            <div className="p-2.5 rounded bg-[#111319] border border-[#272a30] flex items-center justify-between text-xs font-mono">
              <div>
                <span className="text-[#ffd58d] font-bold block">OCT24 (V24 Node)</span>
                <span className="text-[10px] text-[#9b8f7f]">
                  Fin: +₹{octTheo.financingCost} | Vault: +₹{octTheo.storageCost}
                </span>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end">
                  <span className="text-[#9b8f7f] text-[11px]">Theo: ₹{octTheo.fairPrice}</span>
                  <span className="text-[#e1e2ea] font-bold">Mkt: ₹72,510</span>
                </div>
                <span className="text-[10px] text-[#ffd58d] block font-bold">
                  Delta: +₹{72510 - octTheo.fairPrice} (Fair)
                </span>
              </div>
            </div>

            {/* DEC24 (Prime Dislocation) */}
            <div className="p-2.5 rounded bg-[#1d2025] border border-[#4edea3]/50 flex items-center justify-between text-xs font-mono">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#4edea3] font-bold">DEC24 (Z24 Node)*</span>
                  <span className="px-1 rounded bg-[#4edea3]/20 text-[#4edea3] text-[9px] font-bold">
                    DISLOCATED
                  </span>
                </div>
                <span className="text-[10px] text-[#9b8f7f]">
                  Fin: +₹{decTheo.financingCost} | Vault: +₹{decTheo.storageCost}
                </span>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end">
                  <span className="text-[#9b8f7f] text-[11px]">Theo: ₹{decTheo.fairPrice}</span>
                  <span className="text-[#4edea3] font-bold">Mkt: ₹73,280</span>
                </div>
                <span className="text-[10px] text-[#4edea3] block font-bold">
                  Delta: +₹{73280 - decTheo.fairPrice} RICH (+2.38σ)
                </span>
              </div>
            </div>

            {/* FEB25 */}
            <div className="p-2.5 rounded bg-[#111319] border border-[#272a30] flex items-center justify-between text-xs font-mono">
              <div>
                <span className="text-[#ffd58d] font-bold block">FEB25 (G25 Node)</span>
                <span className="text-[10px] text-[#9b8f7f]">
                  Fin: +₹{febTheo.financingCost} | Vault: +₹{febTheo.storageCost}
                </span>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end">
                  <span className="text-[#9b8f7f] text-[11px]">Theo: ₹{febTheo.fairPrice}</span>
                  <span className="text-[#e1e2ea] font-bold">Mkt: ₹73,990</span>
                </div>
                <span className="text-[10px] text-[#9b8f7f] block">
                  Delta: +₹{73990 - febTheo.fairPrice}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
