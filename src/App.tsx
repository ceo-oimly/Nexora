import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { LandingView } from './components/landing/LandingView';
import { DashboardView } from './components/dashboard/DashboardView';
import { TradeView } from './components/trading/TradeView';
import { TransactionsView } from './components/transactions/TransactionsView';
import { DepositView } from './components/wallet/DepositView';
import { WithdrawView } from './components/wallet/WithdrawView';
import { SettingsView } from './components/settings/SettingsView';
import { SupportView } from './components/support/SupportView';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AuthModal } from './components/auth/AuthModal';
import { testFirestoreConnection } from './lib/firebase';

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);

  useEffect(() => {
    testFirestoreConnection();
  }, []);

  const handleOpenAuth = (mode: 'login' | 'signup') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleOpenTxDetails = (txId: string) => {
    setSelectedTxId(txId);
    setCurrentTab('transactions');
  };

  return (
    <div className="min-h-screen bg-[#f0f4f9] text-slate-800 flex flex-col font-sans selection:bg-blue-600/20 selection:text-blue-700">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onNavigate={(tab) => {
          if (tab === 'login') {
            handleOpenAuth('login');
          } else {
            setCurrentTab(tab);
          }
        }}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'landing' && (
          <LandingView
            onGetStarted={() => handleOpenAuth('signup')}
            onExploreDemo={() => setCurrentTab('dashboard')}
            onLogin={() => handleOpenAuth('login')}
          />
        )}

        {currentTab === 'dashboard' && (
          <DashboardView
            onNavigate={(tab) => setCurrentTab(tab)}
            onOpenTransactionDetails={handleOpenTxDetails}
          />
        )}

        {currentTab === 'trade' && <TradeView />}

        {currentTab === 'transactions' && (
          <TransactionsView
            initialTxId={selectedTxId}
            onCloseInitialTx={() => setSelectedTxId(null)}
          />
        )}

        {currentTab === 'deposit' && (
          <DepositView onDepositComplete={() => setCurrentTab('dashboard')} />
        )}

        {currentTab === 'withdraw' && (
          <WithdrawView onWithdrawComplete={() => setCurrentTab('transactions')} />
        )}

        {currentTab === 'settings' && <SettingsView />}

        {currentTab === 'support' && <SupportView />}

        {currentTab === 'admin' && <AdminDashboard />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 px-4 text-xs text-slate-500 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-blue-600 flex items-center justify-center font-bold text-white text-xs">
              N
            </div>
            <span className="font-bold text-slate-800">NEXORA CRYPTO EXCHANGE</span>
            <span>— Institutional Audited Ledger</span>
          </div>

          <div className="flex items-center gap-6 font-medium">
            <button
              onClick={() => setCurrentTab('landing')}
              className="hover:text-blue-600 transition-colors"
            >
              Exchange Overview
            </button>
            <button
              onClick={() => setCurrentTab('trade')}
              className="hover:text-blue-600 transition-colors"
            >
              BTC Spot Terminal
            </button>
            <button
              onClick={() => setCurrentTab('support')}
              className="hover:text-blue-600 transition-colors"
            >
              Support Desk
            </button>
            <span className="font-mono-numbers text-[11px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Double-Entry Ledger: Active
            </span>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode={authModalMode}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
