import React from 'react';
import { MarketAlert } from '../types/arbitrage';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: MarketAlert[];
  onMarkAllAsRead: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  alerts,
  onMarkAllAsRead,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-[#191c21] border-l border-[#32353b] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-[#272a30] flex items-center justify-between bg-[#111319]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#ffd58d] text-[20px]">
              notifications_active
            </span>
            <h3 className="text-headline-sm text-[#e1e2ea] font-bold">Desk Telemetry Alerts</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded flex items-center justify-center text-[#9b8f7f] hover:text-[#e1e2ea] hover:bg-[#272a30] transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Action bar */}
        <div className="px-4 py-2 bg-[#111319]/50 border-b border-[#272a30] flex items-center justify-between">
          <span className="text-[11px] text-[#9b8f7f] font-mono">
            {alerts.filter((a) => !a.isRead).length} unread signals
          </span>
          <button
            onClick={onMarkAllAsRead}
            className="text-[11px] text-[#ffd58d] hover:underline font-mono font-semibold"
          >
            Mark all read
          </button>
        </div>

        {/* Alerts list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3 rounded-lg border transition-all ${
                alert.severity === 'critical'
                  ? 'bg-[#1d2025] border-[#4edea3]/40'
                  : alert.severity === 'warning'
                  ? 'bg-[#1d2025] border-[#ffd58d]/40'
                  : 'bg-[#191c21] border-[#272a30]'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <span
                  className={`text-xs font-mono font-bold ${
                    alert.severity === 'critical'
                      ? 'text-[#4edea3]'
                      : alert.severity === 'warning'
                      ? 'text-[#ffd58d]'
                      : 'text-[#7bd0ff]'
                  }`}
                >
                  {alert.title}
                </span>
                <span className="text-[10px] text-[#9b8f7f] whitespace-nowrap font-mono">
                  {alert.timestamp}
                </span>
              </div>
              <p className="text-body-sm text-[#d2c5b3] leading-relaxed">{alert.description}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#272a30] bg-[#111319] text-center">
          <span className="text-[11px] text-[#9b8f7f] font-mono">
            Direct feed via MCX FIX Gateway 4.4
          </span>
        </div>
      </div>
    </div>
  );
};
