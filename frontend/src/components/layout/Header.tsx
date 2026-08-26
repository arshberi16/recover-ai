import React, { useState } from 'react';
import { 
  Search, 
  Moon, 
  Sun, 
  Bell, 
  ChevronDown, 
  UserCheck, 
  LogOut,
  LogIn,
  CheckCircle2,
  Calendar,
  Check
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { AuthModal } from '../auth/AuthModal';

interface HeaderProps {
  onSearchChange?: (val: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onSearchChange }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const dateRange = 'Last 30 Days';

  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Evening UPI Surge Detected', desc: 'UPI failures spiked 23% between 7 PM - 10 PM IST.', time: '10m ago', unread: true },
    { id: 2, title: 'High-Value Recovery Complete', desc: 'TXN-8921 (₹50,000) successfully recovered.', time: '1h ago', unread: true },
    { id: 3, title: 'Model Re-evaluation Saved', desc: 'Persisted joblib ML model retrained with 92.6% accuracy.', time: '3h ago', unread: false }
  ]);

  const hasUnread = notifications.some(n => n.unread);

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const handleToggleUnread = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: !n.unread } : n));
  };

  return (
    <>
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between transition-colors">
        {/* Left: Global Search Bar */}
        <div className="flex items-center gap-4 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search transaction ID, customer, amount..."
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-blue-500 text-slate-900 dark:text-slate-100 placeholder-slate-400 transition-all focus:outline-none"
            />
          </div>
        </div>

        {/* Right: Controls & User Profile */}
        <div className="flex items-center gap-3">
          {/* Sandbox Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            SANDBOX ENVIRONMENT
          </div>

          {/* Date Selector */}
          <div className="relative hidden sm:block">
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              <span>{dateRange}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
            title="Toggle Light/Dark Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Notification Bell Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all relative"
            >
              <Bell className="w-4 h-4" />
              {hasUnread && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden text-xs">
                <div className="p-3 border-b border-slate-100 dark:border-slate-800 font-bold flex justify-between items-center text-slate-900 dark:text-white">
                  <div className="flex items-center gap-1.5">
                    <span>Notifications</span>
                    {hasUnread && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                        {notifications.filter(n => n.unread).length} new
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[10px] text-blue-600 hover:text-blue-500 dark:text-blue-400 font-semibold cursor-pointer flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    Mark all read
                  </button>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto">
                  {notifications.map(n => (
                    <div 
                      key={n.id}
                      onClick={() => handleToggleUnread(n.id)}
                      className={`p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${
                        n.unread ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          {n.unread && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
                          {n.title}
                        </span>
                        <span className="text-[10px] font-normal text-slate-400">{n.time}</span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 pl-3">{n.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1" />

          {/* User Profile / Auth Button */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-left"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold flex items-center justify-center text-xs shadow-sm">
                  {user.name ? user.name.slice(0, 2).toUpperCase() : 'PA'}
                </div>
                <div className="hidden md:block">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">{user.name}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                    Enterprise Authenticated
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-2 text-xs space-y-1">
                  <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="font-bold text-slate-900 dark:text-white">{user.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{user.email}</div>
                  </div>
                  <button
                    onClick={() => { setIsAuthModalOpen(true); setShowUserMenu(false); }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-2 font-medium"
                  >
                    <UserCheck className="w-4 h-4 text-blue-500" />
                    Switch Merchant Account
                  </button>
                  <button
                    onClick={() => { signOut(); setShowUserMenu(false); }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center gap-2 font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In to Portal
            </button>
          )}
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
};
