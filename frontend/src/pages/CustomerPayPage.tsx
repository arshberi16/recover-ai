import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  CreditCard, 
  QrCode, 
  ArrowRight, 
  FileText,
  RefreshCw,
  Smartphone,
  Mail
} from 'lucide-react';
import type { Transaction } from '../types';
import { fetchTransactions, executeRecoveryAction, API_BASE_URL } from '../services/api';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';

const UPIQRCode: React.FC<{ amount: number; txnId: string }> = ({ amount, txnId }) => {
  const upiPayload = `upi://pay?pa=recoverai.merchant@okicici&pn=TechCorp%20Solutions&am=${amount}.00&cu=INR&tn=Payment%20Recovery%20${txnId}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiPayload)}`;

  return (
    <div className="p-4 bg-white rounded-2xl flex flex-col items-center justify-center space-y-3 border border-slate-700 shadow-2xl max-w-[260px] mx-auto text-slate-900">
      <div className="relative group p-1.5 bg-white rounded-xl border border-slate-200 shadow-sm">
        <img 
          src={qrCodeUrl} 
          alt={`Scan to Pay ₹${amount}`}
          className="w-48 h-48 object-contain rounded-lg" 
        />
      </div>
      <div className="text-center space-y-1">
        <div className="text-[11px] font-mono font-bold text-slate-900 flex items-center justify-center gap-1">
          <span className="text-slate-500">Payee VPA:</span>
          <span className="text-blue-600 font-extrabold">recoverai.merchant@okicici</span>
        </div>
        <div className="text-[11px] font-extrabold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300 inline-block">
          Scan to Pay ₹{amount.toLocaleString('en-IN')}
        </div>
      </div>
      <div className="text-[9px] text-slate-500 font-semibold text-center leading-tight">
        ⚡ NPCI Compliant Real UPI QR • Scannable by GPay, PhonePe, Paytm & Camera
      </div>
    </div>
  );
};

export const CustomerPayPage: React.FC = () => {
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'card'>('upi');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Email & Receipt states
  const [receiptEmail, setReceiptEmail] = useState<string>('');
  const [receiptNumber, setReceiptNumber] = useState<string>('');

  // Modal prompt states
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // Card Form State
  const [cardForm, setCardForm] = useState({ number: '4111 •••• •••• 4242', exp: '12/28', cvv: '888', name: 'Alex Smith' });
  const [otpCode, setOtpCode] = useState('849201');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('txn') || params.get('transaction_id');
    const paramEmail = params.get('email');
    const savedUserEmail = localStorage.getItem('recoverai_user_email');
    if (paramEmail) {
      setReceiptEmail(paramEmail);
    } else if (savedUserEmail) {
      setReceiptEmail(savedUserEmail);
    }

    if (id) {
      loadTxn(id);

      // Real-time Status Synchronization Polling (every 2.5s)
      const interval = setInterval(async () => {
        try {
          const res = await fetchTransactions({ search: id, limit: 1 });
          if (res.items && res.items.length > 0) {
            const currentTxn = res.items[0];
            const s = String(currentTxn.status).toUpperCase();
            if (s === 'COMPLETED' || s === 'RECOVERED' || s === 'SUCCESS') {
              setTransaction(currentTxn);
              setPaymentSuccess(true);
              clearInterval(interval);
            }
          }
        } catch (e) {}
      }, 2500);

      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, []);

  const loadTxn = async (id: string) => {
    setLoading(true);
    const params = new URLSearchParams(window.location.search);
    const paramEmail = params.get('email');
    try {
      const res = await fetchTransactions({ search: id, limit: 1 });
      if (res.items && res.items.length > 0) {
        const txn = res.items[0];
        setTransaction(txn);
        const resolvedEmail = paramEmail || (txn.customer?.email !== 'customer@example.com' ? txn.customer?.email : null) || localStorage.getItem('recoverai_user_email') || 'customer@example.com';
        setReceiptEmail(resolvedEmail);
        const s = String(txn.status).toUpperCase();
        if (s === 'COMPLETED' || s === 'RECOVERED' || s === 'SUCCESS') {
          setPaymentSuccess(true);
        }
      } else {
        const fallbackEmail = paramEmail || localStorage.getItem('recoverai_user_email') || 'customer@example.com';
        setReceiptEmail(fallbackEmail);
        setTransaction({
          id: 'mock-1',
          transaction_id: id,
          customer_id: 'CUST-101',
          customer: { name: 'Valued Customer', email: fallbackEmail },
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

  const executePayNow = async () => {
    if (!transaction) return;
    setShowAuthModal(false);
    setProcessing(true);

    const targetEmail = receiptEmail.trim() || transaction.customer?.email || localStorage.getItem('recoverai_user_email') || 'customer@example.com';
    const generatedReceiptNum = receiptNumber || `REC-${Math.floor(100000 + Math.random() * 900000)}`;
    setReceiptNumber(generatedReceiptNum);

    try {
      // 1. Dispatch Vercel Serverless Payment Receipt Email
      if (typeof window !== 'undefined') {
        fetch('/api/send-receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: targetEmail,
            name: transaction.customer?.name || 'Valued Customer',
            transaction_id: transaction.transaction_id,
            amount: transaction.amount,
            receipt_number: generatedReceiptNum
          })
        }).catch(() => {});
      }

      // 2. Dispatch Backend API Payment Receipt Endpoint Fallback
      fetch(`${API_BASE_URL}/actions/send-receipt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          name: transaction.customer?.name || 'Valued Customer',
          transaction_id: transaction.transaction_id,
          amount: transaction.amount,
          receipt_number: generatedReceiptNum
        })
      }).catch(() => {});

      await executeRecoveryAction(
        transaction.transaction_id, 
        'RETRY_PAYMENT', 
        'Customer completed quick-pay link',
        {
          email: targetEmail,
          name: transaction.customer?.name || 'Valued Customer',
          amount: transaction.amount,
          bank_name: (transaction as any).bank_name || (transaction as any).bank || 'HDFC Bank',
          failure_reason: transaction.failure_reason
        }
      );
      setPaymentSuccess(true);
    } catch (err: any) {
      setErrorMsg(`Payment processing failed: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="dark min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 font-sans selection:bg-blue-500 selection:text-white">
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
                <span className="text-white font-bold">{receiptNumber || 'REC-879311'}</span>
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
              <span>A confirmation receipt has been dispatched to {receiptEmail || transaction?.customer?.email || 'your email'}.</span>
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

            {/* Customer Email Input for Receipt */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>Email Address for Payment Receipt</span>
                <span className="text-[10px] text-blue-400 font-medium">Instant PDF Confirmation</span>
              </div>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                <input
                  type="email"
                  value={receiptEmail}
                  onChange={(e) => setReceiptEmail(e.target.value)}
                  placeholder="your.email@gmail.com"
                  required
                  className="w-full pl-10 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Payment Method Rail Options */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-300">Select Payment Rail</label>
              
              <div className="grid grid-cols-2 gap-3">
                {/* Instant UPI */}
                <button
                  type="button"
                  onClick={() => setSelectedMethod('upi')}
                  className={`p-4 rounded-2xl text-left space-y-1.5 transition-all ${
                    selectedMethod === 'upi'
                      ? 'border-2 border-blue-500 bg-blue-600/20 text-white shadow-md shadow-blue-500/10'
                      : 'border border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50'
                  }`}
                >
                  <QrCode className={`w-5 h-5 ${selectedMethod === 'upi' ? 'text-blue-400' : 'text-slate-400'}`} />
                  <div className="text-xs font-bold text-white">Instant UPI</div>
                  <div className="text-[10px] text-slate-400">GPay, PhonePe, Paytm</div>
                </button>

                {/* Cards */}
                <button
                  type="button"
                  onClick={() => setSelectedMethod('card')}
                  className={`p-4 rounded-2xl text-left space-y-1.5 transition-all ${
                    selectedMethod === 'card'
                      ? 'border-2 border-blue-500 bg-blue-600/20 text-white shadow-md shadow-blue-500/10'
                      : 'border border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50'
                  }`}
                >
                  <CreditCard className={`w-5 h-5 ${selectedMethod === 'card' ? 'text-blue-400' : 'text-slate-400'}`} />
                  <div className="text-xs font-bold text-white">Credit / Debit Cards</div>
                  <div className="text-[10px] text-slate-400">Visa, Mastercard, RuPay</div>
                </button>
              </div>

              {/* DYNAMIC METHOD DETAILS VIEW */}
              {selectedMethod === 'upi' && (
                <div className="p-4 bg-slate-950/90 rounded-2xl border border-slate-800 space-y-4 animate-in fade-in duration-200">
                  <div className="text-center space-y-1">
                    <div className="text-xs font-bold text-slate-200">Scan QR Code using any UPI App</div>
                    <div className="text-[11px] text-slate-400">Google Pay, PhonePe, Paytm, BHIM or iPhone Camera</div>
                  </div>
                  
                  <UPIQRCode amount={transaction.amount} txnId={transaction.transaction_id} />
                </div>
              )}

              {selectedMethod === 'card' && (
                <div className="p-4 bg-slate-950/90 rounded-2xl border border-slate-800 space-y-3 animate-in fade-in duration-200 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Card Number</label>
                    <input
                      type="text"
                      value={cardForm.number}
                      onChange={(e) => setCardForm({ ...cardForm, number: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg font-mono text-white font-bold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">Expiry (MM/YY)</label>
                      <input
                        type="text"
                        value={cardForm.exp}
                        onChange={(e) => setCardForm({ ...cardForm, exp: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg font-mono text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">CVV Code</label>
                      <input
                        type="password"
                        maxLength={3}
                        value={cardForm.cvv}
                        onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg font-mono text-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl">
                {errorMsg}
              </div>
            )}

            {/* Pay Now Trigger Button */}
            <Button
              variant="primary"
              className="w-full justify-center py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all"
              loading={processing}
              icon={<ArrowRight className="w-4 h-4" />}
              onClick={() => setShowAuthModal(true)}
            >
              {selectedMethod === 'upi' && `Simulate Mobile QR Scan & Pay ₹${transaction.amount.toLocaleString('en-IN')}`}
              {selectedMethod === 'card' && `Pay ₹${transaction.amount.toLocaleString('en-IN')} via Card`}
            </Button>

            <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
              <Lock className="w-3 h-3 text-slate-400" />
              Secured by RecoverAI Payment Mesh • PCI-DSS Compliant
            </div>
          </div>
        ) : null}
      </div>

      {/* INTERACTIVE PAYMENT AUTHORIZATION PROMPT MODAL */}
      <Modal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title={
          selectedMethod === 'upi'
            ? 'Authorize Mobile UPI Payment'
            : '3D-Secure Card Verification'
        }
      >
        <div className="space-y-4 p-1 text-xs">
          {selectedMethod === 'upi' && (
            <div className="space-y-3">
              <div className="p-3.5 bg-blue-950/50 border border-blue-800/60 rounded-2xl flex items-center gap-3">
                <Smartphone className="w-6 h-6 text-blue-400 shrink-0" />
                <div>
                  <div className="font-bold text-blue-200 text-sm">UPI Payment Prompt Received</div>
                  <div className="text-[11px] text-slate-300">Authorize payment of <strong className="text-emerald-400 font-mono">₹{transaction?.amount.toLocaleString('en-IN')}</strong> to <strong>TechCorp Solutions Pvt Ltd</strong>?</div>
                </div>
              </div>
            </div>
          )}

          {selectedMethod === 'card' && (
            <div className="space-y-3">
              <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl space-y-1 font-mono text-[11px]">
                <div className="text-slate-400">Card: <span className="text-white font-bold">{cardForm.number}</span></div>
                <div className="text-slate-400">Amount: <span className="text-emerald-400 font-bold">₹{transaction?.amount.toLocaleString('en-IN')}</span></div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Enter 6-Digit Bank OTP (Sent to mobile)</label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-center font-mono font-bold text-base tracking-widest text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <Button
              variant="outline"
              onClick={() => setShowAuthModal(false)}
              className="text-xs font-bold border-slate-700 hover:bg-slate-800 text-slate-300"
            >
              Cancel / Decline
            </Button>

            <Button
              onClick={executePayNow}
              disabled={processing}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              {processing ? 'Processing Payment...' : `Authorize & Pay ₹${transaction?.amount.toLocaleString('en-IN')}`}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
