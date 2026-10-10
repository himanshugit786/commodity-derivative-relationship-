import React from 'react';

interface VaultModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VaultModal: React.FC<VaultModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#191c21] border border-[#32353b] rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#272a30] flex items-center justify-between bg-[#111319]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#7bd0ff] text-[20px]">
              inventory_2
            </span>
            <div>
              <h3 className="text-headline-sm text-[#e1e2ea] font-bold">
                MCX Vault Demat Depository
              </h3>
              <span className="text-body-sm text-[#9b8f7f]">
                Physical Bullion Settlement Coverage
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

        {/* Content */}
        <div className="p-4 space-y-4 text-xs font-mono">
          <div className="p-3 rounded bg-[#111319] border border-[#272a30]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[#9b8f7f]">Total Demat Bullion in Vaults:</span>
              <span className="text-[#4edea3] text-sm font-bold">8,400 kg</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#9b8f7f]">Delivery Settlement Coverage:</span>
              <span className="text-[#4edea3] font-bold">142% (Adequate Cover)</span>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[#9b8f7f] uppercase text-[11px] font-bold">
              Regional Vault Hubs Breakdown
            </span>

            {/* Ahmedabad Vault */}
            <div className="p-2.5 rounded bg-[#1d2025] border border-[#4edea3]/30 flex items-center justify-between">
              <div>
                <span className="text-[#ffd58d] font-bold block">Ahmedabad (Primary Hub)</span>
                <span className="text-[10px] text-[#9b8f7f]">
                  MMTC-PAMP & Brink's India Vault
                </span>
              </div>
              <div className="text-right">
                <span className="text-[#e1e2ea] font-bold text-sm block">4,120 kg</span>
                <span className="text-[10px] text-[#4edea3]">49.0% share</span>
              </div>
            </div>

            {/* Mumbai Vault */}
            <div className="p-2.5 rounded bg-[#191c21] border border-[#272a30] flex items-center justify-between">
              <div>
                <span className="text-[#e1e2ea] font-bold block">Mumbai (BKC Central)</span>
                <span className="text-[10px] text-[#9b8f7f]">Sequel Logistics Demat Depo</span>
              </div>
              <div className="text-right">
                <span className="text-[#e1e2ea] font-bold text-sm block">2,850 kg</span>
                <span className="text-[10px] text-[#9b8f7f]">33.9% share</span>
              </div>
            </div>

            {/* New Delhi Vault */}
            <div className="p-2.5 rounded bg-[#191c21] border border-[#272a30] flex items-center justify-between">
              <div>
                <span className="text-[#e1e2ea] font-bold block">New Delhi (Jhandewalan)</span>
                <span className="text-[10px] text-[#9b8f7f]">BVC Vault Services</span>
              </div>
              <div className="text-right">
                <span className="text-[#e1e2ea] font-bold text-sm block">1,430 kg</span>
                <span className="text-[10px] text-[#9b8f7f]">17.1% share</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded bg-[#111319] border border-[#272a30] text-[11px] text-[#d2c5b3] space-y-1">
            <div className="text-[#ffd58d] font-bold">Good Delivery Assay Standard</div>
            <p>
              All bars held in demat state are accredited 995 fineness or London Bullion Market
              Association (LBMA) approved 999 purity bars with serialized assayer certification.
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-[#272a30] bg-[#111319]">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded bg-[#272a30] hover:bg-[#32353b] text-[#e1e2ea] font-mono text-xs font-bold uppercase transition-colors"
          >
            Close Demat Report
          </button>
        </div>
      </div>
    </div>
  );
};
