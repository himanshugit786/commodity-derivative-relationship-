import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { BottomNav, TabType } from './components/BottomNav';
import { ExecutionModal } from './components/ExecutionModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { VaultModal } from './components/VaultModal';
import { ProfileModal } from './components/ProfileModal';
import { DesktopWorkstationView } from './views/DesktopWorkstationView';
import { SpreadCurveView } from './views/SpreadCurveView';
import { PairArbView } from './views/PairArbView';
import { CostModelView } from './views/CostModelView';
import { PositionsView } from './views/PositionsView';
import {
  INITIAL_ALERTS,
  INITIAL_COST_PARAMS,
  INITIAL_OMS_PRINTS,
  INITIAL_PAIRS,
  INITIAL_POSITIONS,
  INITIAL_TENORS,
} from './data/mockMarketData';
import { CalendarPair, OmsPrint, OpenSpreadPosition } from './types/arbitrage';
import { sounds } from './utils/audio';

export default function App() {
  // Default to desktop workstation view
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState<TabType>('spread-curve');

  const [pairs, setPairs] = useState(INITIAL_PAIRS);
  const [tenors, setTenors] = useState(INITIAL_TENORS);
  const [selectedPair, setSelectedPair] = useState<CalendarPair>(INITIAL_PAIRS[0]); // OCT24-DEC24
  const [positions, setPositions] = useState<OpenSpreadPosition[]>(INITIAL_POSITIONS);
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [costParams, setCostParams] = useState(INITIAL_COST_PARAMS);
  const [omsPrints, setOmsPrints] = useState<OmsPrint[]>(INITIAL_OMS_PRINTS);
  const [spotPrice, setSpotPrice] = useState<number>(71840);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Modals state
  const [isExecutionOpen, setIsExecutionOpen] = useState(false);
  const [executionDirection, setExecutionDirection] = useState<'BUY_SPREAD' | 'SELL_SPREAD'>('SELL_SPREAD');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Live simulation state
  const [liveStatus, setLiveStatus] = useState<'live' | 'paused'>('live');
  const [tickInterval, setTickInterval] = useState<number>(500); // 500ms default active streaming

  // Notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Live market tick generator
  const executeTick = useCallback(() => {
    // 1. Randomly jitter spot price by ±₹1-2 (within 71830 - 71850)
    const spotJitter = Math.random() > 0.5 ? 1 : -1;
    const newSpot = Math.min(71860, Math.max(71820, spotPrice + spotJitter));
    setSpotPrice(newSpot);

    // 2. Randomly jitter one of the contracts (DEC24 or OCT24)
    const isDecTick = Math.random() > 0.4;
    const isOctTick = !isDecTick && Math.random() > 0.5;
    const dir = Math.random() > 0.5 ? 1 : -1;

    setTenors((prev) =>
      prev.map((t) => {
        if (t.code === 'DEC24' && isDecTick) {
          const newPrice = Math.min(73295, Math.max(73265, t.price + dir));
          return {
            ...t,
            price: newPrice,
            tickDirection: dir > 0 ? 'up' : 'down',
          };
        }
        if (t.code === 'OCT24' && isOctTick) {
          const newPrice = Math.min(72520, Math.max(72500, t.price + dir));
          return {
            ...t,
            price: newPrice,
            tickDirection: dir > 0 ? 'up' : 'down',
          };
        }
        return { ...t, tickDirection: undefined };
      })
    );

    // 3. Update Calendar Pairs based on contract prices
    setPairs((prev) =>
      prev.map((p) => {
        if (p.id === 'OCT24-DEC24') {
          // Calculate spread
          const spreadJitter = Math.random() > 0.6 ? (Math.random() > 0.5 ? 1 : -1) : 0;
          const newGross = Math.min(776, Math.max(764, p.grossSpread + spreadJitter));
          const netEdge = newGross - p.carryExpense;
          const zScore = parseFloat(((newGross - 610) / 67.2).toFixed(2));
          return {
            ...p,
            grossSpread: newGross,
            grossSpreadBps: Math.round((newGross / 72510) * 10000),
            netArbEdge: netEdge,
            lotValueEdge: netEdge * 100,
            zScore,
            tickDirection: spreadJitter > 0 ? 'up' : spreadJitter < 0 ? 'down' : undefined,
          };
        }
        return p;
      })
    );

    // 4. Update MTM P&L on Open Positions in real time!
    setPositions((prev) =>
      prev.map((pos) => {
        if (pos.pairId === 'OCT24-DEC24') {
          // Spread price shifted
          const spreadJitter = Math.random() > 0.6 ? (Math.random() > 0.5 ? 1 : -1) : 0;
          const currentSpread = Math.min(776, Math.max(764, pos.currentSpread + spreadJitter));
          // If Sell Spread: profit = (entrySpread - currentSpread) or basis convergence
          // In RV calendar roll: captured net edge = ₹16,000/Lot baseline + spread diff
          const diffPts = currentSpread - pos.entrySpread;
          const deltaPnl = pos.direction === 'SELL_SPREAD' ? -diffPts * 100 * pos.lots : diffPts * 100 * pos.lots;
          const newPnl = 80000 + deltaPnl;
          return {
            ...pos,
            currentSpread,
            unrealizedPnl: newPnl,
          };
        }
        return pos;
      })
    );

    // 5. Occasionally push a new real-time OMS print into the tape (every ~6-10 ticks)
    if (Math.random() > 0.85) {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}.${String(now.getMilliseconds()).padStart(3, '0')}`;
      const printQty = Math.floor(1 + Math.random() * 8);
      const isSell = Math.random() > 0.35;
      const spreadP = 769 + Math.floor(Math.random() * 3);

      const newPrint: OmsPrint = {
        id: `PRT-${Date.now().toString().slice(-4)}`,
        timestamp: timeStr,
        instrument: 'MCX GOLD OCT24/DEC24 ROLL',
        direction: isSell ? 'SELL' : 'BUY',
        lots: printQty,
        spread: spreadP,
        status: 'MATCHED',
      };

      setOmsPrints((prev) => [newPrint, ...prev.slice(0, 24)]);
    }
  }, [spotPrice]);

  // Continuous live tick loop
  useEffect(() => {
    if (liveStatus === 'paused') return;

    const interval = setInterval(() => {
      executeTick();
    }, tickInterval);

    return () => clearInterval(interval);
  }, [liveStatus, tickInterval, executeTick]);

  // Keep selectedPair synced with pairs state
  useEffect(() => {
    const updated = pairs.find((p) => p.id === selectedPair.id);
    if (updated) {
      setSelectedPair(updated);
    }
  }, [pairs, selectedPair.id]);

  const handleOpenExecution = (direction: 'BUY_SPREAD' | 'SELL_SPREAD' = 'SELL_SPREAD') => {
    setExecutionDirection(direction);
    setIsExecutionOpen(true);
  };

  const handleExecuteTrade = (newPosData: Omit<OpenSpreadPosition, 'id' | 'openDate'>) => {
    const newPosition: OpenSpreadPosition = {
      ...newPosData,
      id: `POS-${String(positions.length + 1).padStart(3, '0')}`,
      openDate: 'Today',
    };
    setPositions([newPosition, ...positions]);

    // Synthesize instant trade print on the OMS tape
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}.${String(now.getMilliseconds()).padStart(3, '0')}`;
    const newPrint: OmsPrint = {
      id: `ORD-${Date.now().toString().slice(-4)}`,
      timestamp: timeStr,
      instrument: `MCX GOLD ${newPosition.pairId.replace('-', '/')} ROLL`,
      direction: newPosition.direction === 'SELL_SPREAD' ? 'SELL' : 'BUY',
      lots: newPosition.lots,
      spread: newPosition.entrySpread,
      status: 'FILLED',
    };
    setOmsPrints([newPrint, ...omsPrints]);

    // Play institutional trade fill chime
    sounds.playFillChime();
    showToast(`Order Filled: Transmitted ${newPosition.lots} Lots @ +₹${newPosition.entrySpread} [${newPosition.pairId}]`);
  };

  const handleSquareOff = (positionId: string) => {
    const target = positions.find((p) => p.id === positionId);
    setPositions(positions.filter((p) => p.id !== positionId));
    sounds.playCloseSound();
    showToast(`Squared off spread position: ${target?.pairId || positionId} (Margin Released)`);
  };

  const handleRollPosition = (positionId: string) => {
    setPositions((prev) =>
      prev.map((p) => {
        if (p.id === positionId) {
          return {
            ...p,
            nearLeg: 'OCT24',
            farLeg: 'DEC24',
            pairId: 'OCT24-DEC24',
            daysToTender: 62,
          };
        }
        return p;
      })
    );
    sounds.playAlertSound();
    showToast(`Position ${positionId} rolled to OCT/DEC tenor node!`);
  };

  const handleMarkAllAlertsRead = () => {
    setAlerts(alerts.map((a) => ({ ...a, isRead: true })));
    sounds.playAlertSound();
    showToast('All market alerts marked as read');
  };

  const unreadAlertsCount = alerts.filter((a) => !a.isRead).length;

  return (
    <div className="min-h-screen bg-[#111319] text-[#e1e2ea] flex flex-col selection:bg-[#e5b869] selection:text-[#422c00]">
      {/* Top Header */}
      <Header
        pairs={pairs}
        selectedPair={selectedPair}
        onSelectPair={setSelectedPair}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        unreadAlertsCount={unreadAlertsCount}
        liveStatus={liveStatus}
        tickInterval={tickInterval}
        onToggleLive={() => setLiveStatus((prev) => (prev === 'live' ? 'paused' : 'live'))}
        onChangeTickInterval={(ms) => setTickInterval(ms)}
        onManualTick={executeTick}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          const next = !soundEnabled;
          setSoundEnabled(next);
          sounds.setEnabled(next);
          if (next) sounds.playFillChime();
        }}
        viewMode={viewMode}
        onToggleViewMode={() => setViewMode((prev) => (prev === 'desktop' ? 'mobile' : 'desktop'))}
        spotPrice={spotPrice}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#1d2025] border border-[#ffd58d] text-[#ffd58d] px-4 py-2 rounded-lg shadow-2xl text-xs font-mono font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top duration-200">
          <span className="material-symbols-outlined text-[16px]">info</span>
          {toastMessage}
        </div>
      )}

      {/* Content Rendering based on ViewMode */}
      {viewMode === 'desktop' ? (
        /* Fullscreen Desktop Workstation Cockpit */
        <main className="flex-1 w-full flex flex-col">
          <DesktopWorkstationView
            tenors={tenors}
            pairs={pairs}
            selectedPair={selectedPair}
            positions={positions}
            costParams={costParams}
            omsPrints={omsPrints}
            spotPrice={spotPrice}
            onSelectPair={setSelectedPair}
            onOpenExecution={handleOpenExecution}
            onOpenVaultModal={() => setIsVaultModalOpen(true)}
            onSquareOff={handleSquareOff}
            onRollPosition={handleRollPosition}
            onExecuteTrade={handleExecuteTrade}
          />
        </main>
      ) : (
        /* Mobile View Mode with Bottom Navigation */
        <>
          <main className="flex-1 w-full max-w-md mx-auto md:max-w-4xl flex flex-col">
            {activeTab === 'pair-arb' && (
              <PairArbView
                selectedPair={selectedPair}
                pairs={pairs}
                onSelectPair={setSelectedPair}
                onOpenExecution={handleOpenExecution}
              />
            )}

            {activeTab === 'spread-curve' && (
              <SpreadCurveView
                tenors={tenors}
                pairs={pairs}
                selectedPair={selectedPair}
                onSelectPair={setSelectedPair}
                onOpenExecution={handleOpenExecution}
                onOpenVaultModal={() => setIsVaultModalOpen(true)}
              />
            )}

            {activeTab === 'cost-model' && (
              <CostModelView tenors={tenors} initialParams={costParams} />
            )}

            {activeTab === 'positions' && (
              <PositionsView
                positions={positions}
                onSquareOff={handleSquareOff}
                onRollPosition={handleRollPosition}
                onOpenExecution={() => handleOpenExecution('SELL_SPREAD')}
              />
            )}
          </main>

          <BottomNav
            activeTab={activeTab}
            onChangeTab={setActiveTab}
            openPositionsCount={positions.length}
          />
        </>
      )}

      {/* Execution Drawer Modal */}
      <ExecutionModal
        isOpen={isExecutionOpen}
        onClose={() => setIsExecutionOpen(false)}
        pair={selectedPair}
        initialDirection={executionDirection}
        onExecuteTrade={handleExecuteTrade}
      />

      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        alerts={alerts}
        onMarkAllAsRead={handleMarkAllAlertsRead}
      />

      {/* Vault Stock Modal */}
      <VaultModal
        isOpen={isVaultModalOpen}
        onClose={() => setIsVaultModalOpen(false)}
      />

      {/* Profile Desk Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
}
