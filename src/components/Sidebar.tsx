import React, { useState } from 'react';
import { 
  LayoutGrid, 
  FileText, 
  User, 
  ChevronDown, 
  ChevronRight,
  MessageSquarePlus
} from 'lucide-react';
import { ActiveScreen, UserType } from '../types';

interface SidebarProps {
  activeScreen: ActiveScreen;
  onNavigate: (screen: ActiveScreen) => void;
  isOpen: boolean;
  userType?: UserType;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeScreen,
  onNavigate,
  isOpen,
  userType = 'merchant',
}) => {
  const [isDisputeOpen, setIsDisputeOpen] = useState(true);

  if (!isOpen) return null;

  return (
    <aside className="w-64 bg-[#f0eef6] text-gray-800 min-h-[calc(100vh-4rem)] border-r border-gray-200/70 py-4 flex flex-col justify-between select-none shrink-0 overflow-y-auto">
      <div className="space-y-1.5 px-2">
        {/* Header Title */}
        <div className="px-3 pt-1 pb-3 text-xs font-bold text-gray-900 tracking-tight">
          {userType === 'merchant' && 'Welcome, Merchant'}
          {userType === 'admin' && 'Welcome, Bank Admin'}
          {userType === 'partner' && 'Welcome, Channel Partner'}
        </div>

        {/* 1. Dashboard */}
        <button
          onClick={() => onNavigate('dashboard')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
            activeScreen === 'dashboard'
              ? 'bg-[#800000] text-white shadow-xs'
              : 'text-gray-700 hover:bg-gray-200/60'
          }`}
        >
          <LayoutGrid className="w-4 h-4 shrink-0" />
          <span>Dashboard</span>
        </button>

        {/* 2. Reports */}
        <button
          onClick={() => onNavigate('reports')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
            activeScreen === 'reports'
              ? 'bg-[#800000] text-white shadow-xs'
              : 'text-gray-700 hover:bg-gray-200/60'
          }`}
        >
          <FileText className="w-4 h-4 shrink-0" />
          <span>Reports</span>
        </button>

        {/* 3. Dispute Management (Collapsible) */}
        <div>
          <button
            onClick={() => setIsDisputeOpen(!isDisputeOpen)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold text-gray-800 hover:bg-gray-200/60 transition-colors"
          >
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 shrink-0 text-gray-700" />
              <span>Dispute Management</span>
            </div>
            {isDisputeOpen ? (
              <ChevronDown className="w-3.5 h-3.5 text-gray-600" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
            )}
          </button>

          {isDisputeOpen && (
            <div className="pt-1 pb-1">
              {/* Chargeback Active Pill Item */}
              <button
                onClick={() => onNavigate(['merchant', 'partner'].includes(userType) ? 'view-chargeback' : 'chargeback-hub')}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold rounded-lg transition-all ${
                  ['chargeback-hub', 'raise-chargeback', 'view-chargeback'].includes(activeScreen)
                    ? 'bg-[#800000] text-white shadow-xs'
                    : 'text-gray-700 hover:bg-gray-200/60'
                }`}
              >
                <div className="w-4 h-4 rounded flex items-center justify-center shrink-0">
                  <MessageSquarePlus className="w-3.5 h-3.5" />
                </div>
                <span>Chargeback</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-3 border-t border-gray-200/60 text-[11px] text-gray-500 font-mono text-center">
        iServeU Portal v2.4.0
      </div>
    </aside>
  );
};
