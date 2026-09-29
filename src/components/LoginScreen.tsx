import React, { useState } from 'react';
import { Eye, EyeOff, Shield, Smartphone, Coins } from 'lucide-react';
import { UserType } from '../types';

interface LoginScreenProps {
  onLogin: (username: string, userType: UserType) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [userType, setUserType] = useState<UserType>('admin');
  const [username, setUsername] = useState('Alok123');
  const [password, setPassword] = useState('Test@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleUserTypeChange = (type: UserType) => {
    setUserType(type);
    if (type === 'admin') {
      setUsername('Alok123');
      setPassword('Test@2026');
    } else if (type === 'merchant') {
      setUsername('Merchant123');
      setPassword('Test@2026');
    } else {
      setUsername('Alok@pt');
      setPassword('Test@2026');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onLogin(username, userType);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#fcfcfc] flex items-center justify-center p-4 sm:p-8 font-sans antialiased select-none">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Side: Elegant exact illustration layout from the uploaded image */}
        <div className="lg:col-span-6 flex items-center justify-center p-4">
          <div className="relative w-full max-w-[480px] flex items-center justify-center">
            <img 
              src="https://res.cloudinary.com/dntpoeif2/image/upload/v1785229975/cloud_xgroc9.png" 
              alt="iServeU Secure Dispute Portal Illustration" 
              className="w-full h-auto object-contain max-h-[480px]"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Right Side: Clean elegant Form matching the uploaded image */}
        <div className="lg:col-span-6 max-w-md w-full mx-auto p-4 sm:p-8 flex flex-col justify-center">
          
          {/* Header section matching exact text and styles */}
          <div className="space-y-2 mb-8">
            <h1 className="text-3xl font-extrabold text-[#111111] tracking-tight">
              Welcome Back!
            </h1>
            <p className="text-sm font-semibold text-[#800000]">
              Please enter your details.
            </p>
          </div>

          {/* Account/Role selection switcher - keeping all flows active */}
          <div className="mb-6 space-y-2">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Select Profile Role
            </label>
            <div className="grid grid-cols-3 gap-1 bg-gray-50 border border-gray-200 rounded-lg p-1">
              <button
                type="button"
                onClick={() => handleUserTypeChange('merchant')}
                className={`py-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  userType === 'merchant'
                    ? 'bg-[#800000] text-white shadow-xs'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Merchant
              </button>
              <button
                type="button"
                onClick={() => handleUserTypeChange('admin')}
                className={`py-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  userType === 'admin'
                    ? 'bg-[#1E3A8A] text-white shadow-xs'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleUserTypeChange('partner')}
                className={`py-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  userType === 'partner'
                    ? 'bg-[#00A896] text-white shadow-xs'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Partner
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Username Input Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700">
                Username<span className="text-[#800000] ml-0.5">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border border-gray-300 focus:border-[#800000] focus:ring-1 focus:ring-[#800000] rounded-lg px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none transition-all"
                placeholder="Enter Username"
                required
              />
            </div>

            {/* Password Input Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700">
                Password<span className="text-[#800000] ml-0.5">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 focus:border-[#800000] focus:ring-1 focus:ring-[#800000] rounded-lg px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none transition-all pr-10"
                  placeholder="Enter Password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-[#800000] transition-colors focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password option */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-gray-300 text-[#800000] focus:ring-[#800000] w-4 h-4 cursor-pointer"
                />
                <span className="font-semibold text-gray-500">Remember Me</span>
              </label>
              <button
                type="button"
                onClick={() => alert('Verification link dispatched to your registered email.')}
                className="font-bold text-[#800000] hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
            </div>

            {/* Log In Submit Button matching color palette exactly */}
            <button
              type="submit"
              className="w-full py-3.5 px-4 text-white font-bold text-sm tracking-wide rounded-lg transition-all cursor-pointer bg-[#ab5251] hover:bg-[#914241] shadow-xs hover:shadow-md text-center"
            >
              Log in
            </button>

          </form>

          {/* Secure gateway footer */}
          <div className="mt-12 pt-6 border-t border-gray-100 text-center">
            <p className="text-[10px] text-gray-400 font-medium">
              Corporate Dispute Management System. Secure SSL Encryption Enabled.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
