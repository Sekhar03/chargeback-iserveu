import React from 'react';
import { X, Check } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full p-8 relative shadow-2xl border border-gray-100 text-center animate-in zoom-in-95 duration-150">
        {/* Top Right Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Custom Character & Check Document Vector Graphic */}
        <div className="my-4 flex justify-center">
          <div className="relative w-44 h-36 flex items-center justify-center">
            {/* Sheet Background Frame */}
            <div className="w-24 h-28 bg-white border-2 border-gray-300 rounded-lg p-2 shadow-sm flex flex-col justify-between relative">
              {/* Lines representing document content */}
              <div className="space-y-1.5">
                <div className="h-2 w-10 bg-emerald-600 rounded"></div>
                <div className="h-1.5 w-full bg-gray-200 rounded"></div>
                <div className="h-1.5 w-4/5 bg-gray-200 rounded"></div>
                <div className="h-1.5 w-full bg-gray-200 rounded"></div>
              </div>

              {/* Green Verified Circle Badge at Top */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white shadow-md">
                <Check className="w-5 h-5 stroke-[3]" />
              </div>
            </div>

            {/* Character Graphic */}
            <div className="absolute bottom-0 -right-2 flex flex-col items-center">
              {/* Green Head / Person */}
              <div className="w-6 h-6 rounded-full bg-emerald-600 border border-white"></div>
              {/* Torso */}
              <div className="w-8 h-12 bg-slate-800 rounded-t-lg -mt-1"></div>
              {/* Legs */}
              <div className="flex gap-1 -mt-1">
                <div className="w-2.5 h-8 bg-slate-900 rounded-b"></div>
                <div className="w-2.5 h-8 bg-slate-900 rounded-b"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Success Message Text */}
        <h2 className="text-lg font-bold text-gray-800 my-4">
          File Upload successfully!
        </h2>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full bg-[#800000] hover:bg-[#680000] text-white font-semibold text-sm py-2.5 rounded-lg transition-colors shadow-md mt-2"
        >
          Close
        </button>
      </div>
    </div>
  );
};
