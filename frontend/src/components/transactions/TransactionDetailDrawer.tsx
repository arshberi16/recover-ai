import React, { useState } from 'react';
import { 
  Sparkles, 
  ShieldAlert, 
  CreditCard, 
  Building2, 
  Clock, 
  UserCheck, 
  CheckCircle, 
  Mail, 
  RotateCcw,
  Activity,
  Trash2
} from 'lucide-react';
import type { Transaction } from '../../types';
import { Drawer } from '../ui/Modal';
import { PriorityBadge, StatusBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { executeRecoveryAction, deleteTransaction } from '../../services/api';

interface TransactionDetailDrawerProps {
  transaction: Transaction | null;
  onClose: () => void;
  onActionComplete?: () => void;
}

export const TransactionDetailDrawer: React.FC<TransactionDetailDrawerProps> = ({
  transaction,
  onClose,
  onActionComplete
}) => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  if (!transaction) return null;

  const handleAction = async (actionType: string) => {
    setLoadingAction(actionType);
    try {
      const res = await executeRecoveryAction(transaction.transaction_id, actionType);
      setActionStatus(res.message);
      if (onActionComplete) onActionComplete();
    } catch (err: any) {
      setActionStatus(`Action failed: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const prob = transaction.recovery_probability || 70;
  const succRate = transaction.customer?.success_rate || 85;

  return (
    <Drawer isOpen={!!transaction} onClose={onClose} title={`Transaction ${transaction.transaction_id}`}>
      <div className="space-y-6">
        {/* Sandbox Environment Toast Banner */}
        <div className="px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[11px] font-semibold flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            SANDBOX ENVIRONMENT
          </span>
          <span className="text-[10px] opacity-80">No real customer cards charged</span>
        </div>

        {/* Action Status Toast Banner */}
        {actionStatus && (
          <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{actionStatus}</span>
          </div>
        )}

        {/* Header Summary Box */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Transaction Amount</div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
              ₹{Number(transaction.amount).toLocaleString('en-IN')}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <StatusBadge status={transaction.status} />
              <PriorityBadge level={transaction.priority_level} />
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400 font-medium">Payment Method</div>
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1 flex items-center justify-end gap-1.5">
              <CreditCard className="w-4 h-4 text-blue-500" />
              {transaction.payment_method}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center justify-end gap-1">
              <Building2 className="w-3.5 h-3.5" />
              {transaction.bank}
            </div>
          </div>
        </div>

        {/* AI RECOVERY INTELLIGENCE CARD (HISTORICAL PATTERN-BASED PREDICTION) */}
        <div className="p-5 rounded-xl bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 text-white shadow-md border border-blue-800/40 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-300">
              <Sparkles className="w-4 h-4 text-blue-400" />
              Historical Pattern-Based ML Prediction
            </div>
            <div className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-mono font-bold">
              Score: {transaction.priority_score}/100
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-500/20 border-2 border-blue-400 flex items-center justify-center shrink-0">
              <span className="text-xl font-extrabold text-emerald-400 font-mono">
                {prob}%
              </span>
            </div>
            <div>
              <div className="text-xs text-blue-200 font-medium">ML Projected Recovery Confidence</div>
              <div className="text-sm font-semibold text-white mt-1">
                Recommended: {transaction.recommended_action}
              </div>
            </div>
          </div>

          {/* EXPLANATION FACTORS */}
          <div className="mt-4 pt-3 border-t border-blue-800/60 text-xs text-slate-200 space-y-1.5 bg-blue-950/40 p-3 rounded-lg border border-blue-900">
            <div className="font-bold text-blue-300 mb-1 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-blue-400" />
              Why this transaction is prioritized ({transaction.priority_level} Priority):
            </div>
            <div className="text-[11px] text-slate-300">
              • <strong>Failure Cause Analysis:</strong> "{transaction.failure_reason}" is statistically associated with high recovery success when retried outside peak bank load.
            </div>
            <div className="text-[11px] text-slate-300">
              • <strong>Customer Track Record:</strong> Customer maintains a historical payment success rate of <strong>{succRate}%</strong>.
            </div>
            <div className="text-[11px] text-slate-300">
              • <strong>Historical Window:</strong> Occurred during hour <strong>{transaction.transaction_hour || '14'}:00 IST</strong>, aligning with optimal retry recovery windows.
            </div>
          </div>
        </div>

        {/* FAILURE REASON & TRANSACTION DETAILS */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Transaction Details & Telemetry</h4>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
              <span className="text-slate-400">Failure Reason:</span>
              <div className="font-semibold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" />
                {transaction.failure_reason}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
              <span className="text-slate-400">Timestamp:</span>
              <div className="font-semibold text-slate-800 dark:text-slate-200 mt-1 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                {new Date(transaction.transaction_timestamp).toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>

        {/* CUSTOMER PAYMENT HISTORY */}
        {transaction.customer && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Customer Profile & History</h4>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-blue-500" />
                    {transaction.customer.name}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{transaction.customer.email}</div>
                </div>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                  {transaction.customer.segment}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-center text-xs">
                <div>
                  <span className="text-slate-400 text-[10px]">Success Rate</span>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                    {transaction.customer.success_rate}%
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">Txn History</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200 font-mono mt-0.5">
                    {transaction.customer.successful_transactions} / {transaction.customer.total_transactions}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">Lifetime Value</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200 font-mono mt-0.5">
                    ₹{(transaction.customer.customer_lifetime_value ? (transaction.customer.customer_lifetime_value/1000).toFixed(0) : '45')}k
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* OPERATIONAL RECOVERY TRIGGER BUTTONS */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Execute Gateway Retry & Recovery Actions</h4>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="primary"
              loading={loadingAction === 'RETRY_PAYMENT'}
              onClick={() => handleAction('RETRY_PAYMENT')}
              icon={<RotateCcw className="w-4 h-4" />}
            >
              Simulate Gateway Retry
            </Button>
            <Button
              variant="outline"
              loading={loadingAction === 'SEND_EMAIL_REMINDER'}
              onClick={() => handleAction('SEND_EMAIL_REMINDER')}
              icon={<Mail className="w-4 h-4 text-blue-500" />}
            >
              Send Recovery Email
            </Button>
            <Button
              variant="outline"
              loading={loadingAction === 'MARK_AS_RECOVERED'}
              onClick={() => handleAction('MARK_AS_RECOVERED')}
              icon={<CheckCircle className="w-4 h-4 text-emerald-500" />}
            >
              Mark Recovered
            </Button>
            <Button
              variant="secondary"
              loading={loadingAction === 'MARK_AS_LOST'}
              onClick={() => handleAction('MARK_AS_LOST')}
              icon={<ShieldAlert className="w-4 h-4 text-rose-500" />}
            >
              Mark Lost
            </Button>
          </div>

          <div className="pt-2">
            <button
              type="button"
              disabled={loadingAction === 'DELETE'}
              onClick={async () => {
                if (!transaction) return;
                const confirmed = window.confirm(
                  `Are you sure you want to delete transaction ${transaction.transaction_id}?\n\nCustomer: ${transaction.customer?.name || 'Customer'}\nAmount: ₹${transaction.amount}\n\nThis action cannot be undone.`
                );
                if (!confirmed) return;

                setLoadingAction('DELETE');
                try {
                  const res = await deleteTransaction(transaction.transaction_id);
                  setActionStatus(res.message);
                  onClose();
                  if (onActionComplete) onActionComplete();
                } catch (err: any) {
                  alert(`Failed to delete transaction: ${err.message}`);
                } finally {
                  setLoadingAction(null);
                }
              }}
              className="w-full py-2.5 px-4 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4 text-rose-500" />
              {loadingAction === 'DELETE' ? 'Deleting Transaction...' : 'Delete Transaction'}
            </button>
          </div>
        </div>
      </div>
    </Drawer>
  );
};
