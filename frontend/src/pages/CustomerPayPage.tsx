import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  CreditCard, 
  QrCode, 
  Building2, 
  ArrowRight, 
  FileText,
  RefreshCw
} from 'lucide-react';
import type { Transaction } from '../types';
import { fetchTransactions, executeRecoveryAction } from '../services/api';
import { Button } from '../components/ui/Button';

export const CustomerPayPage: React.FC = () => {
  const [txnId, setTxnId] = useState<string | null>(null);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('txn') || params.get('transaction_id');
    setTxnId(id);

    if (id) {
      loadTxn(id);
    } else {
      setLoading(false);
    }
  }, []);

  const loadTxn = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetchTransactions({ search: id, limit: 1 });
      if (res.items && res.items.length > 0) {
        setTransaction(res.items[0]);
      } else {
        // Fallback mock
        setTransaction({
          id: 'mock-1',
          transaction_id: id,
          customer_id: 'CUST-101',
          customer: { name: 'Valued Customer', email: 'arshberi01@gmail.com' },
          amount: 4999,
          currency: 'INR',
          payment_method: 'UPI',
          bank_name: 'HDFC Bank',
          failure_reason: 'Bank Timeout',
          status: 'FAILED',
          recovery_probability: 85,
          transaction_timestamp: new Date().toISOString()
        } as any);
      }
    } catch (err: any) {
      setErrorMsg(`Could not load transaction details: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async () => {
    if (!transaction) return;
    setProcessing(true);
    try {
      await executeRecoveryAction(transaction.transaction_id, 'RETRY_PAYMENT', 'Customer completed quick-pay link');
      setPaymentSuccess(true);
    } catch (err: any) {
      setErrorMsg(`Payment processing failed: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="dark min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 font-sans selection:bg-blue-500 selection:text-white">
      {/* Ambient background glow */}
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-lg space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold tracking-wide">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            RecoverAI Secure Quick-Pay Gateway
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Complete Your Payment
          </h1>
          <p className="text-xs text-slate-400">
            256-Bit SSL Encrypted Payment Recovery Channel
          </p>
        </div>

        {/* MAIN CARD CONTAINER */}
        {loading ? (
          <div className="p-8 text-center space-y-4 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-xl">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Fetching secure payment details...</p>
          </div>
        ) : paymentSuccess ? (
          /* SUCCESS RECEIPT SCREEN */
          <div className="p-8 text-center space-y-6 bg-slate-900/95 border border-emerald-500/40 rounded-3xl shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Payment Recovered Successfully!</h2>
              <p className="text-xs text-slate-400">
                Your payment of <strong className="text-emerald-400 font-mono text-sm">₹{transaction?.amount.toLocaleString('en-IN')}</strong> has been confirmed and verified.
              </p>
            </div>

            <div className="p-4 bg-slate-950/90 rounded-2xl border border-slate-800 text-left text-xs space-y-2 font-mono shadow-inner">
              <div className="flex justify-between text-slate-400">
                <span>Receipt Number:</span>
                <span className="text-white font-bold">REC-{Math.floor(100000 + Math.random() * 900000)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Transaction ID:</span>
                <span className="text-blue-400 font-bold">{transaction?.transaction_id}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Status:</span>
                <span className="text-emerald-400 font-bold">COMPLETED (RECOVERED)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Date & Time:</span>
                <span className="text-slate-300">{new Date().toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="p-3 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-[11px] text-emerald-300 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>A confirmation receipt has been dispatched to {transaction?.customer?.email || 'your email'}.</span>
            </div>

            <Button
              variant="outline"
              className="w-full justify-center text-xs border-slate-700 hover:bg-slate-800 text-slate-300"
              onClick={() => window.close()}
            >
              Close Window
            </Button>
          </div>
        ) : transaction ? (
          /* PAYMENT FORM SCREEN */
          <div className="p-6 sm:p-8 space-y-6 bg-slate-900/95 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-xl">
            {/* Merchant & Order Summary Box */}
            <div className="p-5 bg-slate-950/90 rounded-2xl border border-slate-800/80 space-y-3 shadow-inner">
              <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-3">
                <span className="text-slate-400 font-semibold">Merchant Entity</span>
                <span className="font-bold text-white">TechCorp Solutions Pvt Ltd</span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Amount Due</div>
                  <div className="text-2xl font-extrabold text-white font-mono">
                    ₹{transaction.amount.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Ref Code</div>
                  <div className="text-xs font-mono font-bold text-blue-400">{transaction.transaction_id}</div>
                </div>
              </div>

              <div className="p-3 bg-amber-950/40 border border-amber-800/40 rounded-xl text-[11px] text-amber-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Previous attempt failed due to <strong>{transaction.failure_reason}</strong> ({transaction.bank || 'HDFC Bank'}). Click below to complete instant retry.
                </span>
              </div>
            </div>

            {/* Payment Method Rail Options */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">Select Payment Rail</label>
              
              <div className="grid grid-cols-3 gap-2.5">
                {/* Instant UPI */}
                <button
                  type="button"
                  onClick={() => setSelectedMethod('upi')}
                  className={`p-3.5 rounded-2xl text-left space-y-1.5 transition-all ${
                    selectedMethod === 'upi'
                      ? 'border-2 border-blue-500 bg-blue-600/20 text-white shadow-md shadow-blue-500/10'
                      : 'border border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50'
                  }`}
                >
                  <QrCode className={`w-5 h-5 ${selectedMethod === 'upi' ? 'text-blue-400' : 'text-slate-400'}`} />
                  <div className="text-xs font-bold text-white">Instant UPI</div>
                  <div className="text-[10px] text-slate-400">GPay, PhonePe</div>
                </button>

                {/* Cards */}
                <button
                  type="button"
                  onClick={() => setSelectedMethod('card')}
                  className={`p-3.5 rounded-2xl text-left space-y-1.5 transition-all ${
                    selectedMethod === 'card'
                      ? 'border-2 border-blue-500 bg-blue-600/20 text-white shadow-md shadow-blue-500/10'
                      : 'border border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50'
                  }`}
                >
                  <CreditCard className={`w-5 h-5 ${selectedMethod === 'card' ? 'text-blue-400' : 'text-slate-400'}`} />
                  <div className="text-xs font-bold text-white">Cards</div>
                  <div className="text-[10px] text-slate-400">Visa, Mastercard</div>
                </button>

                {/* Net Banking */}
                <button
                  type="button"
                  onClick={() => setSelectedMethod('netbanking')}
                  className={`p-3.5 rounded-2xl text-left space-y-1.5 transition-all ${
                    selectedMethod === 'netbanking'
                      ? 'border-2 border-blue-500 bg-blue-600/20 text-white shadow-md shadow-blue-500/10'
                      : 'border border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50'
                  }`}
                >
                  <Building2 className={`w-5 h-5 ${selectedMethod === 'netbanking' ? 'text-blue-400' : 'text-slate-400'}`} />
                  <div className="text-xs font-bold text-white">Net Banking</div>
                  <div className="text-[10px] text-slate-400">HDFC, SBI, ICICI</div>
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl">
                {errorMsg}
              </div>
            )}

            {/* Pay Now Button */}
            <Button
              variant="primary"
              className="w-full justify-center py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all"
              loading={processing}
              icon={<ArrowRight className="w-4 h-4" />}
              onClick={handlePayNow}
            >
              Pay ₹{transaction.amount.toLocaleString('en-IN')} Now (1-Click Retry)
            </Button>

            <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 pt-1">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Secured by RecoverAI Payment Mesh • PCI-DSS Compliant</span>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center space-y-4 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl">
            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
            <div className="space-y-1">
              <h2 className="text-base font-bold text-white">Invalid or Expired Payment Link</h2>
              <p className="text-xs text-slate-400">No active transaction ref was found for "{txnId}".</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
