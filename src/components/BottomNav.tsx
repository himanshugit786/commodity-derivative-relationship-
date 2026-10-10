import React from 'react';

export type TabType = 'pair-arb' | 'spread-curve' | 'cost-model' | 'positions';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  openPositionsCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  openPositionsCount,
}) => {
  const tabs = [
    {
      id: 'pair-arb' as TabType,
      label: 'Pair Arb',
      icon: 'candlestick_chart',
    },
    {
      id: 'spread-curve' as TabType,
      label: 'Spread Curve',
      icon: 'show_chart',
    },
    {
      id: 'cost-model' as TabType,
      label: 'Cost Model',
      icon: 'calculate',
    },
    {
      id: 'positions' as TabType,
      label: 'Positions',
      icon: 'account_balance_wallet',
      badge: openPositionsCount > 0 ? openPositionsCount : undefined,
    },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 pb-safe bg-[#0b0e13]/92 backdrop-blur-xl border-t border-[#272a30] shadow-[0_-1px_10px_rgba(0,0,0,0.5)]">
      <div className="max-w-md mx-auto md:max-w-4xl grid grid-cols-4 items-center h-16 px-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex flex-col items-center justify-center min-h-[48px] h-full gap-1 transition-all relative ${
                isActive
                  ? 'text-[#ffd58d] border-t-2 border-[#ffd58d] bg-[#ffd58d]/5 -mt-[1px]'
                  : 'text-[#d2c5b3] hover:text-[#e1e2ea] border-t-2 border-transparent'
              }`}
            >
              <div className="relative">
                <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
                {tab.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 bg-[#4edea3] text-[#003824] text-[9px] font-bold px-1 rounded-full min-w-[14px] h-[14px] flex items-center justify-center leading-none">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-label-mono-micro uppercase font-semibold tracking-wider text-[9px]">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
