import React from 'react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#191c21] border border-[#32353b] rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#272a30] flex items-center justify-between bg-[#111319]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#ffd58d] flex items-center justify-center">
              <span className="material-symbols-outlined text-[#422c00] text-[18px]">person</span>
            </div>
            <div>
              <h3 className="text-headline-sm text-[#e1e2ea] font-bold">DESK: MUM-ARB-04</h3>
              <span className="text-body-sm text-[#9b8f7f]">
                Algorithmic Spread & Roll Execution
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

        {/* Details */}
        <div className="p-4 space-y-4 text-xs font-mono">
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded bg-[#111319] border border-[#272a30]">
              <span className="text-[#9b8f7f] block text-[10px]">TOTAL MARGIN ALLOCATED</span>
              <span className="text-sm font-bold text-[#ffd58d]">₹65.00 Lakhs</span>
              <span className="text-[10px] text-[#4edea3]">₹16.80L Available</span>
            </div>
            <div className="p-3 rounded bg-[#111319] border border-[#272a30]">
              <span className="text-[#9b8f7f] block text-[10px]">SPAN SPREAD BENEFIT</span>
              <span className="text-sm font-bold text-[#4edea3]">75.0% Relief</span>
              <span className="text-[10px] text-[#9b8f7f]">Calendar Hedge</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="p-2.5 rounded bg-[#111319] border border-[#272a30] flex items-center justify-between">
              <span className="text-[#9b8f7f]">MCX Member ID:</span>
              <span className="text-[#e1e2ea] font-bold">INZ000214838 (Tier-1 Clearing)</span>
            </div>
            <div className="p-2.5 rounded bg-[#111319] border border-[#272a30] flex items-center justify-between">
              <span className="text-[#9b8f7f]">Gateway Protocol:</span>
              <span className="text-[#4edea3] font-bold">FIX 4.4 Ultra-DMA (Colo BKC)</span>
            </div>
            <div className="p-2.5 rounded bg-[#111319] border border-[#272a30] flex items-center justify-between">
              <span className="text-[#9b8f7f]">Roundtrip Latency:</span>
              <span className="text-[#ffd58d] font-bold">0.84 ms</span>
            </div>
            <div className="p-2.5 rounded bg-[#111319] border border-[#272a30] flex items-center justify-between">
              <span className="text-[#9b8f7f]">Max Single Leg Lot Limit:</span>
              <span className="text-[#e1e2ea] font-bold">100 Lots (100 kg)</span>
            </div>
          </div>

          <div className="p-3 rounded bg-[#111319] border border-[#272a30] text-[11px] text-[#9b8f7f]">
            <span className="text-[#ffd58d] font-bold block mb-1">Risk Governance Engine</span>
            Auto circuit limits active for ±3.50σ spread anomalies. Auto kill-switch disengaged.
          </div>
        </div>

        <div className="p-4 border-t border-[#272a30] bg-[#111319]">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded bg-[#272a30] hover:bg-[#32353b] text-[#e1e2ea] font-mono text-xs font-bold uppercase transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
