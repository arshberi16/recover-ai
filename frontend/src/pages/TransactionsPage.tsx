import React, { useEffect, useState } from 'react';
import { 
  Search, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw,
  Sparkles,
  PlusCircle,
  CheckCircle,
  Mail,
  Zap,
  UploadCloud,
  Calendar,
  Trash2
} from 'lucide-react';
import type { Transaction } from '../types';
import { fetchTransactions, ingestTransaction, deleteTransaction } from '../services/api';
import { Card } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { TransactionDetailDrawer } from '../components/transactions/TransactionDetailDrawer';
import { ImportDataModal } from '../components/transactions/ImportDataModal';

interface TransactionsPageProps {
  initialSearch?: string;
  onSelectTransaction: (txn: Transaction) => void;
  selectedTxn: Transaction | null;
  onCloseDrawer: () => void;
}

export const TransactionsPage: React.FC<TransactionsPageProps> = ({
  initialSearch = '',
  onSelectTransaction,
  selectedTxn,
  onCloseDrawer
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Import / Link Gateway Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const nowISO = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  // Single Ingest Modal State
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  const [ingestForm, setIngestForm] = useState({
    transaction_id: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
    customer_name: 'Alex Smith',
    customer_email: 'alex.smith@example.com',
    amount: '4999',
    payment_method: 'UPI',
    bank_name: 'HDFC',
    failure_reason: 'Bank Timeout',
    transaction_timestamp: nowISO
  });
  const [ingesting, setIngesting] = useState(false);

  // Filter States
  const [search, setSearch] = useState(initialSearch);
  const [paymentMethod, setPaymentMethod] = useState<string>('All');
  const [failureReason, setFailureReason] = useState<string>('All');
  const [status, setStatus] = useState<string>('All');
  const [priorityLevel, setPriorityLevel] = useState<string>('All');
  
  // Date Range Filter States
  const [datePreset, setDatePreset] = useState<string>('All');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [sortBy, setSortBy] = useState<string>('transaction_timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const limit = 10;

  const handleDatePresetChange = (preset: string) => {
    setDatePreset(preset);
    const now = new Date();
    
    if (preset === 'All') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'Today') {
      const todayStr = now.toISOString().split('T')[0];
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === '7d') {
      const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (preset === '30d') {
      const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    }
  };

  const loadData = async () => {
    if (transactions.length === 0) {
      setLoading(true);
    }

    try {
      const res = await fetchTransactions({
        search,
        payment_method: paymentMethod,
        failure_reason: failureReason,
        status,
        priority_level: priorityLevel,
        start_date: startDate,
        end_date: endDate,
        sort_by: sortBy,
        sort_order: sortOrder,
        page,
        limit
      });
      setTransactions(res.items || []);
      setTotalCount(res.total || 0);
    } catch (err) {
      console.error("Failed to load transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialSearch !== undefined) {
      setSearch(initialSearch);
    }
  }, [initialSearch]);

  useEffect(() => {
    loadData();
  }, [search, paymentMethod, failureReason, status, priorityLevel, startDate, endDate, sortBy, sortOrder, page]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleIngestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingestForm.customer_email || !ingestForm.amount) return;

    setIngesting(true);
    try {
      const res = await ingestTransaction({
        transaction_id: ingestForm.transaction_id,
        customer_name: ingestForm.customer_name,
        customer_email: ingestForm.customer_email,
        amount: parseFloat(ingestForm.amount),
        payment_method: ingestForm.payment_method,
        bank_name: ingestForm.bank_name,
        failure_reason: ingestForm.failure_reason,
        transaction_timestamp: ingestForm.transaction_timestamp ? new Date(ingestForm.transaction_timestamp).toISOString() : new Date().toISOString(),
        status: 'FAILED'
      });

      setIsIngestModalOpen(false);
      setToastMsg(`Transaction ${res.transaction_id} ingested! ML Recovery Probability: ${res.ml_prediction?.recovery_probability || 75}%`);
      loadData();
      
      // Reset form ID
      setIngestForm(prev => ({
        ...prev,
        transaction_id: `TXN-${Math.floor(100000 + Math.random() * 900000)}`
      }));
    } catch (err: any) {
      setToastMsg(`Error ingesting transaction: ${err.message}`);
    } finally {
      setIngesting(false);
      setTimeout(() => setToastMsg(null), 5000);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Toast Banner */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-500/40 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMsg}</span>
        </div>
      )}

      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Transactions Registry
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Searchable log of all failed, recovered, and pending transactions with AI recovery scores.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            icon={<UploadCloud className="w-4 h-4" />}
            onClick={() => setIsImportModalOpen(true)}
          >
            Import File / Link API
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<PlusCircle className="w-4 h-4" />}
            onClick={() => setIsIngestModalOpen(true)}
          >
            + Ingest Custom Txn
          </Button>
          <Button variant="outline" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={loadData}>
            Refresh
          </Button>
        </div>
      </div>

      {/* FILTER CONTROLS CARD */}
      <Card className="p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
          {/* Search Bar */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Txn ID, customer name, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Payment Method Filter */}
          <div>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="All">All Payment Methods</option>
              <option value="UPI">UPI</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Debit Card">Debit Card</option>
              <option value="Net Banking">Net Banking</option>
              <option value="Wallet">Wallet</option>
            </select>
          </div>

          {/* Failure Reason Filter */}
          <div>
            <select
              value={failureReason}
              onChange={(e) => setFailureReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="All">All Failure Reasons</option>
              <option value="Insufficient Funds">Insufficient Funds</option>
              <option value="Bank Decline">Bank Decline</option>
              <option value="Network Error">Network Error</option>
              <option value="Timeout">Timeout</option>
              <option value="Authentication Failure">Authentication Failure</option>
              <option value="User Abandonment">User Abandonment</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Failed">Failed</option>
              <option value="Recovered">Recovered</option>
              <option value="Pending Retry">Pending Retry</option>
            </select>
          </div>

          {/* Priority Level Filter */}
          <div>
            <select
              value={priorityLevel}
              onChange={(e) => setPriorityLevel(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="All">All Priorities</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>
          </div>
        </div>

        {/* DATE RANGE FILTER ROW */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              Date Filter:
            </span>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
              {[
                { key: 'All', label: 'All Time' },
                { key: 'Today', label: 'Today' },
                { key: '7d', label: 'Last 7 Days' },
                { key: '30d', label: 'Last 30 Days' },
                { key: 'Custom', label: 'Custom Range' }
              ].map(p => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => handleDatePresetChange(p.key)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    datePreset === p.key
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Pickers */}
          {(datePreset === 'Custom' || startDate || endDate) && (
            <div className="flex items-center gap-2 animate-in fade-in duration-200">
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-slate-400 font-medium">From:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setDatePreset('Custom');
                    setStartDate(e.target.value);
                  }}
                  className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1">
                <span className="text-[11px] text-slate-400 font-medium">To:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setDatePreset('Custom');
                    setEndDate(e.target.value);
                  }}
                  className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>

              {(startDate || endDate) && (
                <button
                  type="button"
                  onClick={() => handleDatePresetChange('All')}
                  className="text-[11px] text-rose-500 hover:underline font-medium"
                >
                  Clear Date
                </button>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* TRANSACTIONS TABLE CARD */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 font-semibold">Transaction ID</th>
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-4 font-semibold cursor-pointer hover:text-blue-500" onClick={() => handleSort('transaction_timestamp')}>
                  <div className="flex items-center gap-1">
                    Date & Time
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 font-semibold cursor-pointer hover:text-blue-500" onClick={() => handleSort('amount')}>
                  <div className="flex items-center gap-1">
                    Amount
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 font-semibold">Method & Bank</th>
                <th className="py-3 px-4 font-semibold">Failure Cause</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold cursor-pointer hover:text-blue-500" onClick={() => handleSort('recovery_probability')}>
                  <div className="flex items-center gap-1">
                    Recovery Score
                    <Sparkles className="w-3 h-3 text-blue-500" />
                  </div>
                </th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 animate-pulse">
                    Loading transactions registry...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No transactions found matching your criteria.
                  </td>
                </tr>
              ) : (
                transactions.map((t: Transaction) => (
                  <tr
                    key={t.transaction_id}
                    onClick={() => onSelectTransaction(t)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {t.transaction_id}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-100">
                      <div>{t.customer?.name || 'Customer'}</div>
                      <div className="text-[10px] text-slate-400">{t.customer?.email || 'N/A'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {new Date(t.transaction_timestamp).toLocaleString('en-IN', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                      ₹{t.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{t.payment_method}</div>
                      <div className="text-[10px] text-slate-400">{t.bank}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                      {t.failure_reason}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full ${
                              t.recovery_probability >= 75 ? 'bg-emerald-500' :
                              t.recovery_probability >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${t.recovery_probability}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                          {t.recovery_probability}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        title="Delete Transaction"
                        onClick={async (e) => {
                          e.stopPropagation();
                          const confirmed = window.confirm(
                            `Are you sure you want to delete transaction ${t.transaction_id}?\n\nCustomer: ${t.customer?.name || 'Customer'}\nAmount: ₹${t.amount}\n\nThis action cannot be undone.`
                          );
                          if (!confirmed) return;

                          try {
                            const res = await deleteTransaction(t.transaction_id);
                            setToastMsg(res.message || `Transaction ${t.transaction_id} deleted.`);
                            loadData();
                            setTimeout(() => setToastMsg(null), 4000);
                          } catch (err: any) {
                            alert(`Failed to delete transaction: ${err.message}`);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <strong className="text-slate-800 dark:text-slate-200">{totalCount > 0 ? (page - 1) * limit + 1 : 0}</strong> to{' '}
            <strong className="text-slate-800 dark:text-slate-200">{Math.min(page * limit, totalCount)}</strong> of{' '}
            <strong className="text-slate-800 dark:text-slate-200">{totalCount}</strong> transactions
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              icon={<ChevronLeft className="w-4 h-4" />}
            >
              Previous
            </Button>
            <span className="px-2 font-semibold text-slate-700 dark:text-slate-300">
              Page {page} of {Math.ceil(totalCount / limit) || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= Math.ceil(totalCount / limit)}
              onClick={() => setPage(prev => prev + 1)}
              icon={<ChevronRight className="w-4 h-4" />}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* MODAL: IMPORT DATA (CSV/PDF/EXCEL & LINK API GATEWAY) */}
      <ImportDataModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        userEmail={localStorage.getItem('recoverai_user_email') || 'admin@recoverai.io'}
        onImportSuccess={(msg) => {
          setToastMsg(msg);
          loadData();
          setTimeout(() => setToastMsg(null), 5000);
        }}
      />

      {/* MODAL: INGEST CUSTOM FAILED TRANSACTION */}
      <Modal
        isOpen={isIngestModalOpen}
        onClose={() => setIsIngestModalOpen(false)}
        title="Simulate / Ingest Custom Failed Transaction"
      >
        <form onSubmit={handleIngestSubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/60 rounded-xl border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-500 shrink-0" />
            <span>
              Ingesting a custom transaction runs the <strong>Scikit-Learn ML Model</strong> in real-time, stores it in the Telemetry Engine, and allows you to test sending email recovery notifications directly to your email!
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Transaction ID</label>
              <input
                type="text"
                value={ingestForm.transaction_id}
                onChange={(e) => setIngestForm({ ...ingestForm, transaction_id: e.target.value })}
                required
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Customer Full Name</label>
              <input
                type="text"
                placeholder="e.g. Arsh Beri"
                value={ingestForm.customer_name}
                onChange={(e) => setIngestForm({ ...ingestForm, customer_name: e.target.value })}
                required
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Customer Test Email <span className="text-blue-500 font-normal">(Your email for recovery testing)</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                placeholder="customer@example.com"
                value={ingestForm.customer_email}
                onChange={(e) => setIngestForm({ ...ingestForm, customer_email: e.target.value })}
                required
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Amount (INR)</label>
              <input
                type="number"
                placeholder="4999"
                value={ingestForm.amount}
                onChange={(e) => setIngestForm({ ...ingestForm, amount: e.target.value })}
                required
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Payment Method</label>
              <select
                value={ingestForm.payment_method}
                onChange={(e) => setIngestForm({ ...ingestForm, payment_method: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-medium"
              >
                <option value="UPI">UPI</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Net Banking">Net Banking</option>
                <option value="Wallet">Wallet</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Issuer Bank</label>
              <select
                value={ingestForm.bank_name}
                onChange={(e) => setIngestForm({ ...ingestForm, bank_name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-medium"
              >
                <option value="HDFC">HDFC Bank</option>
                <option value="ICICI">ICICI Bank</option>
                <option value="SBI">State Bank of India</option>
                <option value="Axis">Axis Bank</option>
                <option value="Kotak">Kotak Mahindra</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Failure Reason</label>
              <select
                value={ingestForm.failure_reason}
                onChange={(e) => setIngestForm({ ...ingestForm, failure_reason: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-medium"
              >
                <option value="Bank Timeout">Bank Timeout (High Recovery Prob)</option>
                <option value="Insufficient Funds">Insufficient Funds</option>
                <option value="Bank Decline">Bank Decline</option>
                <option value="Network Error">Network Error</option>
                <option value="Card Expired">Card Expired</option>
              </select>
            </div>
          </div>

          {/* Transaction Date & Time Field */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              Transaction Date & Time
            </label>
            <input
              type="datetime-local"
              value={ingestForm.transaction_timestamp}
              onChange={(e) => setIngestForm({ ...ingestForm, transaction_timestamp: e.target.value })}
              required
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-medium"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsIngestModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={ingesting}
              icon={<PlusCircle className="w-4 h-4" />}
            >
              Ingest & Run ML Scoring
            </Button>
          </div>
        </form>
      </Modal>

      {/* TRANSACTION DETAILS DRAWER */}
      <TransactionDetailDrawer
        transaction={selectedTxn}
        onClose={onCloseDrawer}
        onActionComplete={loadData}
      />
    </div>
  );
};
