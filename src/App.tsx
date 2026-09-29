import React, { useState } from 'react';
import { ActiveScreen, ChargebackRecord, UserProfile, UserType } from './types';
import { INITIAL_CHARGEBACKS } from './data/mockDisputes';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { ReportsView } from './components/ReportsView';
import { ChargebackHub } from './components/ChargebackHub';
import { RaiseChargeback } from './components/RaiseChargeback';
import { ViewChargeback } from './components/ViewChargeback';
import { SuccessModal } from './components/SuccessModal';
import { LoginScreen } from './components/LoginScreen';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [chargebacks, setChargebacks] = useState<ChargebackRecord[]>(INITIAL_CHARGEBACKS);
  
  // Chargeback active tab state for navigation from dashboard
  const [chargebackActiveTab, setChargebackActiveTab] = useState<
    "Action Required" | "Review Required" | "Under Review" | "Closed" | "All Disputes"
  >("All Disputes");
  const [chargebackCardFilter, setChargebackCardFilter] = useState<string | null>(null);

  const handleDashboardNavigate = (
    tab: "Action Required" | "Review Required" | "Under Review" | "Closed" | "All Disputes",
    cardFilter?: string
  ) => {
    setChargebackActiveTab(tab);
    setChargebackCardFilter(cardFilter || null);
    setActiveScreen("view-chargeback");
  };

  // User Profile
  const [user, setUser] = useState<UserProfile>({
    username: 'Alok123',
    fullName: 'Alok Samal (Bank Admin)',
    role: 'Dispute Admin / Nodal Officer',
    userType: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    walletBalance: 0,
  });

  const handleLogin = (username: string, userType: UserType) => {
    if (username === 'Alok123' || userType === 'admin') {
      setUser({
        username: 'Alok123',
        fullName: 'Alok Samal (Bank Admin)',
        role: 'Dispute Admin / Nodal Officer',
        userType: 'admin',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
        walletBalance: 0,
      });
    } else if (userType === 'merchant') {
      setUser({
        username: username || 'Merchant123',
        fullName: username === 'Merchant123' ? 'Alok Samal (Merchant)' : (username || 'Merchant User'),
        role: 'Registered Merchant',
        userType: 'merchant',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
        walletBalance: 13173.97,
      });
    } else {
      setUser({
        username: username || 'Alok@pt',
        fullName: username === 'Alok@pt' ? 'Alok Samal (Channel Partner)' : (username || 'iServeU Partner'),
        role: 'iServeU Channel Partner',
        userType: 'partner',
        avatar: '',
        walletBalance: 52480.00,
      });
    }
    setIsLoggedIn(true);
    setActiveScreen('dashboard');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setActiveScreen('login');
  };

  const handleUploadSuccess = (uploadedRows: any[]) => {
    // Transform uploaded rows into chargeback records
    const newRecords: ChargebackRecord[] = uploadedRows.map((row, idx) => {
      // If row is already processed as a ChargebackRecord, use it directly
      if (row.id && row.rrn && row.status) {
        return row as ChargebackRecord;
      }
      return {
        id: `CB-2026-00${chargebacks.length + idx + 1}`,
        rrn: row.RRN_Number || row.RRN || `${421890342170 + idx}`,
        merchantId: row.Merchant_Id || 'NSDL_MER_9042',
        merchantName: row.Beneficiery || 'Bulk Uploaded Merchant',
        transactionDate: row.Transaction_Date || row.Txndate || '2026-07-28',
        disputeDate: '2026-07-28',
        amount: Number(row.Dispute_Amount || row.Txnamount) || 2500,
        reasonCode: row.Reason_Code || '4853',
        reasonDescription: (() => {
          const raw = String(row.Reason_Description || row.Adjtype || 'Chargeback').toLowerCase();
          if (raw.includes('pre')) return 'Pre-Arbitration';
          if (raw.includes('arbitration')) return 'Arbitration';
          return 'Chargeback';
        })(),
        status: 'New',
        subStatus: 'Chargeback New',
        cardNetwork: 'UPI',
        terminalId: row.Terminal_Id || row.Terminalid || 'TM-88210',
        customerMobile: row.Customer_Mobile || row.Ben_Mobile_No || '+91 98765 43210',
      };
    });

    setChargebacks(prev => [...newRecords, ...prev]);
    setIsSuccessModalOpen(true);
  };

  const handleCloseSuccessModal = () => {
    setIsSuccessModalOpen(false);
    setActiveScreen('view-chargeback');
  };

  const handleUpdateStatus = (
    id: string,
    status: 'New' | 'Accepted' | 'Rejected' | 'Pending' | 'Approved' | 'Under Review' | 'Raised' | 'Partially Accepted',
    subStatus?: string,
    partialDetails?: {
      partialAmount?: number;
      partialReason?: string;
      partialEvidenceFiles?: string[];
      partialEvidenceRemarks?: string;
    }
  ) => {
    setChargebacks(prev =>
      prev.map(cb => {
        if (cb.id === id) {
          return {
            ...cb,
            status,
            subStatus: subStatus || cb.subStatus,
            ...(partialDetails ? {
              partialAmount: partialDetails.partialAmount,
              partialReason: partialDetails.partialReason,
              partialEvidenceFiles: partialDetails.partialEvidenceFiles,
              partialEvidenceRemarks: partialDetails.partialEvidenceRemarks,
            } : {}),
          };
        }
        return cb;
      })
    );
  };

  if (!isLoggedIn || activeScreen === 'login') {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#fafafc] flex flex-col font-sans text-gray-800 antialiased selection:bg-[#800000] selection:text-white">
      {/* Top Header Navigation */}
      <Header
        user={user}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onNavigate={(screen) => setActiveScreen(screen)}
        onLogout={handleLogout}
        onSwitchUserType={(type) => handleLogin(type === 'merchant' ? 'Merchant123' : 'Alok123', type)}
      />

      {/* Main Body Container (Sidebar + Content Workspace) */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          activeScreen={activeScreen}
          onNavigate={(screen) => setActiveScreen(screen)}
          isOpen={sidebarOpen}
          userType={user.userType}
        />

        {/* Main Workspace Area */}
        <main className="flex-1 overflow-y-auto min-w-0 bg-[#fafafc] pb-12">
          {activeScreen === 'dashboard' && (
            <DashboardView
              records={chargebacks}
              userType={user.userType}
              onNavigateTab={handleDashboardNavigate}
            />
          )}

          {activeScreen === 'reports' && (
            <ReportsView
              records={chargebacks}
              onUpdateStatus={handleUpdateStatus}
              userType={user.userType}
            />
          )}

          {(activeScreen === 'chargeback-hub' || activeScreen === 'raise-chargeback') && ['merchant', 'partner'].includes(user.userType) && (
            <ViewChargeback
              records={chargebacks}
              onBack={() => setActiveScreen('dashboard')}
              onRaiseClick={() => {}}
              userType={user.userType}
              onUpdateStatus={handleUpdateStatus}
              initialTab={chargebackActiveTab}
              initialCardFilter={chargebackCardFilter}
            />
          )}

          {activeScreen === 'chargeback-hub' && !['merchant', 'partner'].includes(user.userType) && (
            <ChargebackHub
              onRaiseClick={() => setActiveScreen('raise-chargeback')}
              onViewClick={() => setActiveScreen('view-chargeback')}
            />
          )}

          {activeScreen === 'raise-chargeback' && !['merchant', 'partner'].includes(user.userType) && (
            <RaiseChargeback
              onBack={() => setActiveScreen('chargeback-hub')}
              onUploadSuccess={handleUploadSuccess}
              chargebacks={chargebacks}
            />
          )}

          {activeScreen === 'view-chargeback' && (
            <ViewChargeback
              records={chargebacks}
              onBack={() => setActiveScreen(['merchant', 'partner'].includes(user.userType) ? 'dashboard' : 'chargeback-hub')}
              onRaiseClick={() => setActiveScreen('raise-chargeback')}
              userType={user.userType}
              onUpdateStatus={handleUpdateStatus}
              initialTab={chargebackActiveTab}
              initialCardFilter={chargebackCardFilter}
            />
          )}
        </main>
      </div>

      {/* Success Modal for File Upload (Screen 3) */}
      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={handleCloseSuccessModal}
      />
    </div>
  );
}
