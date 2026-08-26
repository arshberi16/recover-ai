import React, { useEffect, useState } from 'react';
import { 
  RefreshCw, 
  Sparkles, 
  Zap, 
  CheckSquare, 
  Square,
  Filter,
  CheckCircle,
  Mail
} from 'lucide-react';
import type { Transaction } from '../types';
import { fetchRecoveryQueue, executeRecoveryAction } from '../services/api';
import { Card } from '../components/ui/Card';
import { PriorityBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

interface RecoveryQueuePageProps {
  onSelectTransaction: (txn: Transaction) => void;
}

export const RecoveryQueuePage: React.FC<RecoveryQueuePageProps> = ({ onSelectTransaction }) => {
  const [queue, setQueue] = useState<Transaction[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchActionLoading, setBatchActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadQueue = async () => {
    setLoading(true);
    const data = await fetchRecoveryQueue(priorityFilter);
    setQueue(data);
    setSelectedIds([]);
    setLoading(false);
  };

  useEffect(() => {
    loadQueue();
  }, [priorityFilter]);

  const toggleSelectAll = () => {
    if (selectedIds.length === queue.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(queue.map(t => t.transaction_id));
    }
  };

  const toggleSelectOne = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSingleAction = async (e: React.MouseEvent, txnId: string, actionType: string) => {
    e.stopPropagation();
    const res = await executeRecoveryAction(txnId, actionType);
    setToastMessage(res.message);
    setQueue(prev => prev.map(t => t.transaction_id === txnId ? { ...t, status: 'Pending Retry' } : t));
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleBatchRetry = async () => {
    if (selectedIds.length === 0) return;
    setBatchActionLoading(true);
    for (const id of selectedIds) {
      await executeRecoveryAction(id, 'Retry Payment');
    }
    setBatchActionLoading(false);
    setToastMessage(`Batch automated retry triggered for ${selectedIds.length} high-priority transactions!`);
    loadQueue();
    setTimeout(() => setToastMessage(null), 5000);
  };

  const totalRecoverableAmount = queue.reduce((acc: number, t: Transaction) => acc + t.amount * (t.recovery_probability / 100.0), 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-500/40 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            AI Recovery Priority Queue
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              Live Ranked
            </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Failed payment opportunities prioritized by ML score taking into account amount, bank codes, and customer value.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <Button
              variant="primary"
              size="sm"
              loading={batchActionLoading}
              onClick={handleBatchRetry}
              icon={<Zap className="w-4 h-4" />}
            >
              Batch Retry Selected ({selectedIds.length})
            </Button>
          )}
          <Button variant="outline" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={loadQueue}>
            Refresh Queue
          </Button>
        </div>
      </div>

      {/* QUEUE STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none">
          <div className="text-xs text-slate-400 font-medium">Total Recoverable Capital in Queue</div>
          {loading ? (
            <div className="h-8 w-36 bg-slate-700/60 animate-pulse rounded-lg mt-1" />
          ) : (
            <div className="text-2xl font-extrabold font-mono mt-1 text-emerald-400">
              ₹{Math.round(totalRecoverableAmount).toLocaleString('en-IN')}
            </div>
          )}
          <div className="text-xs text-slate-300 mt-2 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Weighted by machine learning recovery probabilities
          </div>
        </Card>

        <Card>
          <div className="text-xs text-slate-400 font-medium">Queue Size</div>
          {loading ? (
            <div className="h-8 w-32 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg mt-1" />
          ) : (
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono mt-1">
              {queue.length} Transactions
            </div>
          )}
          <div className="text-xs text-slate-500 mt-2">
            High Priority: {loading ? <span className="inline-block w-4 h-3 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" /> : <strong className="text-rose-600 dark:text-rose-400">{queue.filter((t: Transaction) => t.priority_level === 'High').length}</strong>}
          </div>
        </Card>

        <Card>
          <div className="text-xs text-slate-400 font-medium">Avg Recovery Probability</div>
          {loading ? (
            <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg mt-1" />
          ) : (
            <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 font-mono mt-1">
              {queue.length > 0 ? Math.round(queue.reduce((acc: number, t: Transaction) => acc + t.recovery_probability, 0) / queue.length) : 0}%
            </div>
          )}
          <div className="text-xs text-slate-500 mt-2">
            Top recommended action: <strong className="text-slate-800 dark:text-slate-200">Off-Peak Automated Retry</strong>
          </div>
        </Card>
      </div>

      {/* FILTER TABS & BATCH ACTION BAR */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1 text-xs font-medium">
          <span className="text-slate-400 mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Priority Filter:
          </span>
          {['All', 'High', 'Medium', 'Low'].map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                priorityFilter === p
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {p === 'All' ? 'All Priorities' : `${p} Priority`}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400">
          Ranked strictly by ML Composite Priority Score (0 - 100)
        </div>
      </div>

      {/* QUEUE TABLE CARD */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3 w-10 text-center">
                  <button onClick={toggleSelectAll} className="text-slate-400 hover:text-slate-600">
                    {selectedIds.length === queue.length && queue.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-3 w-12 text-center">Rank</th>
                <th className="py-3 px-4 font-semibold">Transaction ID</th>
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-4 font-semibold">Amount</th>
                <th className="py-3 px-4 font-semibold">Recovery Prob.</th>
                <th className="py-3 px-4 font-semibold">Priority Score</th>
                <th className="py-3 px-4 font-semibold">Recommended Action</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 animate-pulse">
                    Calculating recovery priority matrix...
                  </td>
                </tr>
              ) : queue.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No failed transactions in this priority queue.
                  </td>
                </tr>
              ) : (
                queue.map((t: Transaction, idx: number) => {
                  const isSelected = selectedIds.includes(t.transaction_id);
                  return (
                    <tr
                      key={t.transaction_id}
                      onClick={() => onSelectTransaction(t)}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50/50 dark:bg-blue-950/30' : ''
                      }`}
                    >
                      <td className="py-3.5 px-3 text-center" onClick={(e) => toggleSelectOne(e, t.transaction_id)}>
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-blue-600 inline" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 dark:text-slate-700 inline" />
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-center font-bold font-mono text-slate-400">
                        #{idx + 1}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {t.transaction_id}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-100">
                        <div>{t.customer?.name || 'Customer'}</div>
                        <div className="text-[10px] text-slate-400">{t.customer?.email || 'N/A'} • {t.payment_method}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                        ₹{t.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                            {t.recovery_probability}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-slate-900 dark:text-slate-100">
                            {t.priority_score}
                          </span>
                          <PriorityBadge level={t.priority_level} />
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                        {t.recommended_action}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={(e) => handleSingleAction(e, t.transaction_id, 'Retry Payment')}
                          >
                            Retry
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<Mail className="w-3.5 h-3.5 text-blue-500" />}
                            onClick={(e) => handleSingleAction(e, t.transaction_id, 'SEND_EMAIL_REMINDER')}
                          >
                            Email
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
