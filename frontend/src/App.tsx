import { useState, useEffect } from 'react';
import type { Transaction } from './types';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { AuthModal } from './components/auth/AuthModal';
import { fetchRecoveryQueue, fetchRecoveryQueueCount } from './services/api';

import { DashboardPage } from './pages/DashboardPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { RecoveryQueuePage } from './pages/RecoveryQueuePage';
import { AIInsightsPage } from './pages/AIInsightsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { CustomerPayPage } from './pages/CustomerPayPage';
import { TransactionDetailDrawer } from './components/transactions/TransactionDetailDrawer';
import { ShieldAlert, Sparkles, Lock, ArrowRight } from 'lucide-react';
import { Button } from './components/ui/Button';

function MainContent() {
  const { user, demoLogin } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [queueCount, setQueueCount] = useState<number>(0);

  // Check if URL is customer quick-pay link
  const isCustomerPayRoute = window.location.pathname === '/pay' || window.location.search.includes('txn=');

  const refreshQueueCount = () => {
    if (user) {
      fetchRecoveryQueueCount()
        .then(cnt => setQueueCount(cnt))
        .catch(() => setQueueCount(0));
    } else {
      setQueueCount(0);
    }
  };

  useEffect(() => {
    refreshQueueCount();
    const handleRefresh = () => refreshQueueCount();
    window.addEventListener('recoverai_refresh_data', handleRefresh);
    return () => window.removeEventListener('recoverai_refresh_data', handleRefresh);
  }, [user, activeTab]);

  if (isCustomerPayRoute) {
    return <CustomerPayPage />;
  }

  if (!user) {
    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex-col items-center justify-center p-6 text-center transition-colors">
        <div className="max-w-md space-y-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-xl dark:shadow-2xl relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>
          
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-600/20 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center mx-auto text-blue-600 dark:text-blue-400 shadow-sm">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 text-xs font-bold uppercase tracking-wider">
              <ShieldAlert className="w-3.5 h-3.5" /> Identity Authentication Required
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              RecoverAI Intelligence Portal
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Company transaction telemetry, ML recovery queues, and financial metrics are protected by RecoverAI Enterprise Security. Please sign in to access your portal.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Button
              variant="primary"
              className="w-full justify-center py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md shadow-blue-500/20"
              icon={<ArrowRight className="w-4 h-4" />}
              onClick={() => setIsAuthModalOpen(true)}
            >
              Sign In to Portal
            </Button>

            <button
              onClick={() => demoLogin('Payment Operations Admin')}
              className="w-full py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-blue-500 dark:text-blue-400" />
              Instant Demo Payment Ops Login
            </button>
          </div>
        </div>

        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      </div>
    );
  }

  const handleGlobalSearch = (val: string) => {
    setGlobalSearch(val);
    if (val.trim() && activeTab !== 'transactions') {
      setActiveTab('transactions');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Left Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} queueCount={queueCount} />

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onSearchChange={handleGlobalSearch} />

        {/* Dynamic Key forces instant page remount & data reload whenever user account switches */}
        <main key={user?.email || 'guest'} className="flex-1 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardPage
              onNavigateTab={setActiveTab}
              onSelectTransaction={(txn) => setSelectedTxn(txn)}
            />
          )}
          {activeTab === 'transactions' && (
            <TransactionsPage
              initialSearch={globalSearch}
              onSelectTransaction={(txn) => setSelectedTxn(txn)}
              selectedTxn={selectedTxn}
              onCloseDrawer={() => setSelectedTxn(null)}
            />
          )}
          {activeTab === 'recovery' && (
            <RecoveryQueuePage
              onSelectTransaction={(txn) => setSelectedTxn(txn)}
            />
          )}
          {activeTab === 'insights' && <AIInsightsPage onNavigateTab={setActiveTab} />}
          {activeTab === 'analytics' && <AnalyticsPage />}
          {activeTab === 'reports' && <ReportsPage />}
          {activeTab === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* Global Transaction Detail Drawer */}
      <TransactionDetailDrawer
        transaction={selectedTxn}
        onClose={() => setSelectedTxn(null)}
        onActionComplete={() => {
          fetchRecoveryQueue()
            .then(res => setQueueCount(res.length))
            .catch(() => setQueueCount(0));
        }}
      />
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
