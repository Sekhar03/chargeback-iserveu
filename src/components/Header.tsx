import React, { useState } from 'react';
import { Menu, Wallet, ChevronDown, User, LogOut, Settings, Shield, Key } from 'lucide-react';
import { UserProfile, ActiveScreen } from '../types';

interface HeaderProps {
  user: UserProfile;
  toggleSidebar: () => void;
  onNavigate: (screen: ActiveScreen) => void;
  onLogout: () => void;
  onSwitchUserType?: (userType: 'admin' | 'merchant' | 'partner') => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  toggleSidebar,
  onNavigate,
  onLogout,
  onSwitchUserType,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-4 flex items-center justify-between sticky top-0 z-30 shadow-xs select-none">
      {/* Left Branding and Hamburger */}
      <div className="flex items-center space-x-3">
        {/* NSDL Payments Bank Logo */}
        <div 
          onClick={() => onNavigate('chargeback-hub')}
          className="flex items-center gap-2 cursor-pointer group"
        >
          {/* NSDL Emblem Icon */}
          <div className="w-8 h-8 rounded-full bg-[#800000] flex items-center justify-center text-amber-300 font-bold text-xs shadow-xs border border-amber-400">
            <div className="w-5 h-5 rounded-full border-2 border-amber-400 flex items-center justify-center">
              <span className="text-[10px] text-white">N</span>
            </div>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[#800000] font-extrabold text-lg tracking-tight font-serif">
              NSDL <span className="font-semibold text-base font-sans text-[#700000]">Payments Bank</span>
            </span>
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="h-7 w-[1.5px] bg-cyan-600/30 mx-1"></div>

        {/* iServeU Brand Logo */}
        <div 
          onClick={() => onNavigate('chargeback-hub')}
          className="flex items-center cursor-pointer"
        >
          <span className="text-[#00A896] font-bold text-xl tracking-tight">
            iServeU
          </span>
          <span className="text-[#00A896] font-bold text-xs align-super -mt-2 font-mono">
            ®
          </span>
        </div>

        {/* Hamburger Menu Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="ml-3 p-1.5 rounded-md text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5 stroke-[2.2]" />
        </button>
      </div>

      {/* Right User Bar & Wallet */}
      <div className="flex items-center space-x-4">
        {/* Wallet Balance Badge */}
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200/80 rounded-lg px-3 py-1.5 text-xs text-gray-800 font-medium">
          <Wallet className="w-4 h-4 text-gray-700" />
          <span>Wallet:</span>
          <span className="font-bold text-gray-900">₹ {user.walletBalance.toLocaleString('en-IN')}</span>
        </div>

        {/* User Profile Pill */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 bg-[#f8e8e8] hover:bg-[#f2dbdb] transition-colors rounded-full px-3 py-1 text-gray-800 border border-[#f0c8c8] focus:outline-none cursor-pointer"
          >
            {/* Turban / Admin Avatar Icon */}
            <div className="w-6 h-6 rounded-full bg-[#800000] flex items-center justify-center text-white text-xs font-bold overflow-hidden border border-amber-300">
              {user.avatar ? (
                <img src={user.avatar} alt="User" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[11px]">👤</span>
              )}
            </div>
            <span className="text-xs font-medium text-gray-800 max-w-[110px] truncate">
              {user.username}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-600" />
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-xs font-bold text-gray-900">{user.fullName}</p>
                <p className="text-[11px] text-gray-500 font-mono">{user.role}</p>
              </div>

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  onNavigate('chargeback-hub');
                }}
                className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
              >
                <User className="w-4 h-4 text-[#800000]" />
                <span>Dispute Hub</span>
              </button>

              {onSwitchUserType && (
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onSwitchUserType(user.userType === 'merchant' ? 'admin' : 'merchant');
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-amber-800 font-semibold hover:bg-amber-50 flex items-center gap-2 cursor-pointer"
                >
                  <Shield className="w-4 h-4 text-amber-600" />
                  <span>Switch to {user.userType === 'merchant' ? 'Bank Admin' : 'Merchant Portal'}</span>
                </button>
              )}

              <div className="border-t border-gray-100 my-1"></div>

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  onLogout();
                }}
                className="w-full text-left px-4 py-2 text-xs text-red-700 font-medium hover:bg-red-50 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4 text-red-600" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
