import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  RefreshCw, 
  Sparkles, 
  BarChart3, 
  FileText, 
  Settings,
  ShieldCheck,
  ChevronRight,
  Link as LinkIcon
} from 'lucide-react';
import { ConnectGatewayModal } from '../auth/ConnectGatewayModal';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  queueCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, queueCount = 0 }) => {
  const [isGatewayModalOpen, setIsGatewayModalOpen] = useState(false);
  const [gatewayDetails, setGatewayDetails] = useState({
    provider: 'Live Gateway Mesh',
    merchantId: 'MCH_982401'
  });

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { 
      id: 'recovery', 
      label: 'Recovery Queue', 
      icon: RefreshCw, 
      badge: queueCount > 0 ? queueCount : undefined 
    },
    { id: 'insights', label: 'AI Insights', icon: Sparkles, highlight: true },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 min-h-screen sticky top-0 transition-colors">
        {/* Brand Header */}
        <div className="p-5 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/80">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-slate-900 dark:text-white text-lg tracking-tight leading-none flex items-center gap-1.5">
              RecoverAI
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">Revenue Recovery Engine</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1 flex-1">
          <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Main Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  {item.highlight && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                  )}
                  {item.badge !== undefined && (
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Merchant / Organization Footer Card */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Connected Gateway</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                {gatewayDetails.provider}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-xs font-medium text-slate-800 dark:text-slate-200">
              <span className="truncate max-w-[120px]">ID: {gatewayDetails.merchantId}</span>
              <button
                onClick={() => setIsGatewayModalOpen(true)}
                className="text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1"
              >
                <LinkIcon className="w-3 h-3" />
                Link ID
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Connect Gateway Modal */}
      <ConnectGatewayModal
        isOpen={isGatewayModalOpen}
        onClose={() => setIsGatewayModalOpen(false)}
        currentMerchantId={gatewayDetails.merchantId}
        onGatewayLinked={(details) => setGatewayDetails({ provider: details.provider, merchantId: details.merchantId })}
      />
    </>
  );
};
