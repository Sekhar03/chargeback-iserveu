import React from 'react';
import { ArrowLeft, RotateCcw, UserSearch } from 'lucide-react';

interface ChargebackHubProps {
  onRaiseClick: () => void;
  onViewClick: () => void;
}

export const ChargebackHub: React.FC<ChargebackHubProps> = ({
  onRaiseClick,
  onViewClick,
}) => {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <button 
            onClick={onViewClick}
            className="text-gray-800 hover:text-[#800000] transition-colors focus:outline-none"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            Chargeback
          </h1>
        </div>
        
        {/* Accent Bar (Yellow-Green progress highlight as in screenshot) */}
        <div className="flex items-center gap-1 pl-7">
          <div className="h-[3px] w-12 bg-yellow-400 rounded-full"></div>
          <div className="h-[3px] w-6 bg-emerald-500 rounded-full"></div>
          <div className="h-[3px] w-2 bg-yellow-400 rounded-full"></div>
        </div>
      </div>

      {/* Two Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 max-w-4xl">
        {/* Card 1: Raise Chargeback */}
        <div
          onClick={onRaiseClick}
          className="bg-white border border-gray-200 hover:border-[#800000] hover:shadow-lg transition-all rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer group space-y-4 min-h-[220px]"
        >
          {/* Maroon Square Icon Holder */}
          <div className="w-20 h-20 rounded-xl bg-[#f8e8e8] group-hover:bg-[#f2d8d8] flex items-center justify-center transition-colors">
            {/* Cash box with return arrow icon */}
            <div className="relative text-[#800000]">
              <RotateCcw className="w-10 h-10 stroke-[2.2] text-[#800000]" />
              <div className="absolute -bottom-1 -right-1 bg-[#800000] text-white rounded-md px-1 text-[9px] font-bold">
                ₹
              </div>
            </div>
          </div>

          <span className="text-base font-semibold text-gray-800 group-hover:text-[#800000] transition-colors">
            Raise Chargeback
          </span>
        </div>

        {/* Card 2: View Chargeback */}
        <div
          onClick={onViewClick}
          className="bg-white border border-gray-200 hover:border-[#800000] hover:shadow-lg transition-all rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer group space-y-4 min-h-[220px]"
        >
          {/* Maroon Square Icon Holder */}
          <div className="w-20 h-20 rounded-xl bg-[#f8e8e8] group-hover:bg-[#f2d8d8] flex items-center justify-center transition-colors">
            {/* User with Eye / Search Icon */}
            <UserSearch className="w-10 h-10 stroke-[2.2] text-[#800000]" />
          </div>

          <span className="text-base font-semibold text-gray-800 group-hover:text-[#800000] transition-colors">
            View Chargeback
          </span>
        </div>
      </div>
    </div>
  );
};
