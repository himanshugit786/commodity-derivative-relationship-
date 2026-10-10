import React, { useState } from 'react';
import { CalendarPair } from '../types/arbitrage';

interface HeaderProps {
  pairs: CalendarPair[];
  selectedPair: CalendarPair;
  onSelectPair: (pair: CalendarPair) => void;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
  unreadAlertsCount: number;
  liveStatus: 'live' | 'paused';
  tickInterval: number;
  onToggleLive: () => void;
  onChangeTickInterval: (interval: number) => void;
  onManualTick: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  viewMode: 'desktop' | 'mobile';
  onToggleViewMode: () => void;
  spotPrice: number;
}

export const Header: React.FC<HeaderProps> = ({
  pairs,
  selectedPair,
  onSelectPair,
  onOpenNotifications,
  onOpenProfile,
  unreadAlertsCount,
  liveStatus,
  tickInterval,
  onToggleLive,
  onChangeTickInterval,
  onManualTick,
  soundEnabled,
  onToggleSound,
  viewMode,
  onToggleViewMode,
  spotPrice,
}) => {
  const [showPairMenu, setShowPairMenu] = useState(false);
  const [showLiveMenu, setShowLiveMenu] = useState(false);

  // Map pair IDs to shorthand tenor notations like M24/Q24
  const getTenorCode = (pairId: string) => {
    switch (pairId) {
      case 'OCT24-DEC24':
        return 'V24/Z24';
      case 'AUG24-OCT24':
        return 'M24/V24';
      case 'AUG24-DEC24':
        return 'M24/Z24';
      case 'DEC24-FEB25':
        return 'Z24/G25';
      default:
        return 'M24/Q24';
    }
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <header className="sticky top-0 inset-x-0 z-50 bg-[#111319]/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.5)] border-b border-[#272a30] pt-safe">
      <div className="w-full px-3 lg:px-6 h-14 flex items-center justify-between">
        {/* Brand & Market Live Tag */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 pr-1">
            <div className="w-7 h-7 rounded bg-[#e5b869]/20 flex items-center justify-center text-[#ffd58d] shadow-sm">
              <span className="material-symbols-outlined text-[18px]">toll</span>
            </div>
            <div className="flex flex-col">
              <span className="text-headline-sm text-[#ffd58d] tracking-tight leading-none font-bold">
                AURA
              </span>
              <span className="text-label-mono-micro text-[#9b8f7f] tracking-widest uppercase">
                GOLD RV
              </span>
            </div>
          </div>

          {/* Live Tick Pill with Dropdown Menu */}
          <div className="relative">
            <button
              onClick={() => setShowLiveMenu(!showLiveMenu)}
              title="Click to change live feed rate or trigger manual tick"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#272a30]/80 hover:bg-[#32353b] transition-colors border border-[#32353b]/50 cursor-pointer"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  liveStatus === 'live' ? 'bg-[#4edea3] animate-pulse' : 'bg-[#9b8f7f]'
                }`}
              ></span>
              <span
                className={`text-label-mono-micro font-bold uppercase ${
                  liveStatus === 'live' ? 'text-[#4edea3]' : 'text-[#9b8f7f]'
                }`}
              >
                {liveStatus === 'live' ? 'MCX LIVE' : 'PAUSED'}
              </span>
              <span className="text-label-numeric-sm text-[#d2c5b3] font-mono">
                {tickInterval}ms
              </span>
              <span className="material-symbols-outlined text-[14px] text-[#9b8f7f]">arrow_drop_down</span>
            </button>

            {/* Live Speed Controls Popover */}
            {showLiveMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowLiveMenu(false)}></div>
                <div className="absolute left-0 top-full mt-1.5 w-64 bg-[#191c21] border border-[#ffd58d]/30 rounded-lg shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs font-mono">
                  <div className="px-2 py-1 text-label-mono-micro text-[#ffd58d] border-b border-[#272a30] mb-1.5 font-bold uppercase flex items-center justify-between">
                    <span>LIVE STREAM SPEED</span>
                    <span className="text-[#4edea3]">FIX 4.4 DMA</span>
                  </div>

                  <div className="space-y-1">
                    {[
                      { ms: 100, label: 'Turbo HFT (100ms)', icon: 'bolt' },
                      { ms: 500, label: 'Active Live (500ms)', icon: 'speed' },
                      { ms: 1000, label: 'Standard Ticks (1000ms)', icon: 'schedule' },
                    ].map((mode) => (
                      <button
                        key={mode.ms}
                        onClick={() => {
                          onChangeTickInterval(mode.ms);
                          if (liveStatus === 'paused') onToggleLive();
                          setShowLiveMenu(false);
                        }}
                        className={`w-full px-2.5 py-1.5 rounded text-left flex items-center justify-between transition-colors cursor-pointer ${
                          tickInterval === mode.ms && liveStatus === 'live'
                            ? 'bg-[#272a30] text-[#4edea3] font-bold border border-[#4edea3]/40'
                            : 'text-[#d2c5b3] hover:bg-[#272a30] hover:text-white'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px]">{mode.icon}</span>
                          {mode.label}
                        </span>
                        {tickInterval === mode.ms && liveStatus === 'live' && (
                          <span className="text-[10px] text-[#4edea3]">● LIVE</span>
                        )}
                      </button>
                    ))}

                    <button
                      onClick={() => {
                        onToggleLive();
                        setShowLiveMenu(false);
                      }}
                      className="w-full px-2.5 py-1.5 rounded text-left flex items-center justify-between text-[#d2c5b3] hover:bg-[#272a30] hover:text-white transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px]">
                          {liveStatus === 'live' ? 'pause' : 'play_arrow'}
                        </span>
                        {liveStatus === 'live' ? 'Pause Streaming' : 'Resume Live Feed'}
                      </span>
                      <span className="text-[10px] text-[#9b8f7f]">
                        {liveStatus === 'live' ? 'PAUSE' : 'RESUME'}
                      </span>
                    </button>
                  </div>

                  <div className="pt-2 mt-2 border-t border-[#272a30] flex items-center justify-between gap-1">
                    <button
                      onClick={() => {
                        onManualTick();
                      }}
                      className="flex-1 py-1.5 px-2 rounded bg-[#ffd58d] hover:bg-[#ffdea9] text-[#422c00] font-bold text-[11px] text-center flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">flash_on</span>
                      Manual Tick
                    </button>
                    <button
                      onClick={() => onToggleSound()}
                      title="Toggle sound effects"
                      className="py-1.5 px-2.5 rounded bg-[#272a30] hover:bg-[#32353b] text-[#d2c5b3] flex items-center justify-center cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px]">
                        {soundEnabled ? 'volume_up' : 'volume_off'}
                      </span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Desktop telemetry ribbons (Visible on large screens) */}
          <div className="hidden lg:flex items-center gap-3 pl-2 text-xs font-mono">
            <span className="text-[#9b8f7f]">
              SPOT GOLD: <strong className="text-[#ffd58d] font-bold">₹{spotPrice.toLocaleString('en-IN')}/10g</strong>
            </span>
            <span className="text-[#9b8f7f]">
              MIBOR: <strong className="text-[#e1e2ea]">6.75%</strong> (+42bps)
            </span>
            <span className="text-[#4edea3] font-bold">
              REGIME: STEEP CONTANGO
            </span>
          </div>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-2 relative">
          {/* Sound Toggle Button */}
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Audio Effects: ON' : 'Audio Effects: MUTED'}
            className="w-9 h-9 hidden sm:flex items-center justify-center rounded bg-[#272a30]/50 hover:bg-[#272a30] text-[#d2c5b3] hover:text-[#e1e2ea] border border-[#32353b] transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">
              {soundEnabled ? 'volume_up' : 'volume_off'}
            </span>
          </button>

          {/* View Mode Toggle: Desktop Fullscreen vs Mobile View */}
          <button
            onClick={onToggleViewMode}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#272a30] hover:bg-[#32353b] text-xs font-mono font-bold text-[#ffd58d] border border-[#32353b] transition-all cursor-pointer"
            title="Toggle between Desktop Full Screen Workstation and Mobile App View"
          >
            <span className="material-symbols-outlined text-[16px]">
              {viewMode === 'desktop' ? 'devices' : 'stay_current_portrait'}
            </span>
            <span>{viewMode === 'desktop' ? 'WORKSTATION (FULL)' : 'MOBILE VIEW'}</span>
          </button>

          {/* Pair Switcher Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => setShowPairMenu(!showPairMenu)}
              aria-label="Switch active spread pair"
              className="min-h-[38px] px-2.5 flex items-center gap-1 rounded bg-[#272a30] hover:bg-[#32353b] text-[#e1e2ea] border border-[#32353b] active:scale-95 transition-all cursor-pointer"
            >
              <span className="text-label-numeric-sm text-[#ffdea9] font-bold">
                {getTenorCode(selectedPair.id)}
              </span>
              <span className="material-symbols-outlined text-[16px] text-[#9b8f7f]">
                unfold_more
              </span>
            </button>

            {/* Tenor Dropdown Menu */}
            {showPairMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowPairMenu(false)}
                ></div>
                <div
                  className="absolute right-0 top-full mt-1.5 w-60 bg-[#191c21] border border-[#ffd58d]/30 rounded-lg shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                >
                  <div className="px-3 py-1.5 text-label-mono-micro text-[#ffd58d] border-b border-[#272a30] mb-1 uppercase font-bold flex items-center justify-between">
                    <span>SELECT TENOR PAIR</span>
                    <span className="text-[9px] text-[#9b8f7f]">{pairs.length} ACTIVE</span>
                  </div>
                  {pairs.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        onSelectPair(p);
                        setShowPairMenu(false);
                      }}
                      className={`w-full px-3 py-2 text-left flex items-center justify-between text-body-sm hover:bg-[#272a30] transition-colors cursor-pointer ${
                        p.id === selectedPair.id ? 'bg-[#272a30] text-[#ffd58d] border-l-2 border-[#ffd58d]' : 'text-[#e1e2ea]'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="font-mono font-bold text-xs">
                          {p.id.replace('-', ' - ')}
                        </span>
                        <span className="text-[10px] text-[#9b8f7f]">
                          {getTenorCode(p.id)} • Gross +₹{p.grossSpread}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          p.zScore > 2
                            ? 'bg-[#4edea3]/20 text-[#4edea3]'
                            : p.zScore < 0
                            ? 'bg-[#ffb4ab]/20 text-[#ffb4ab]'
                            : 'bg-[#ffd58d]/20 text-[#ffd58d]'
                        }`}
                      >
                        {p.zScore > 0 ? `+${p.zScore}σ` : `${p.zScore}σ`}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Fullscreen browser trigger */}
          <button
            onClick={handleToggleFullscreen}
            title="Toggle Browser Fullscreen"
            className="w-9 h-9 hidden md:flex items-center justify-center rounded bg-[#272a30]/50 hover:bg-[#272a30] text-[#d2c5b3] hover:text-[#e1e2ea] border border-[#32353b] transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">fullscreen</span>
          </button>

          {/* Notifications Button */}
          <button
            onClick={onOpenNotifications}
            aria-label="Alerts and notifications"
            className="w-9 h-9 flex items-center justify-center rounded bg-[#272a30]/50 hover:bg-[#272a30] text-[#d2c5b3] hover:text-[#e1e2ea] relative active:scale-95 transition-transform border border-[#32353b] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[19px]">notifications</span>
            {unreadAlertsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ffd58d] ring-2 ring-[#111319]"></span>
            )}
          </button>

          {/* Profile Desk Button */}
          <button
            onClick={onOpenProfile}
            aria-label="Trader Profile and Desk Limits"
            className="w-8 h-8 rounded-full bg-[#ffd58d] hover:bg-[#ffdea9] flex items-center justify-center ml-0.5 active:scale-95 transition-transform shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[#422c00] text-[18px]">person</span>
          </button>
        </div>
      </div>
    </header>
  );
};
