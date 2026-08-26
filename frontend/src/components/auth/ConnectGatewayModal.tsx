import React, { useState } from 'react';
import { 
  Key, 
  Lock, 
  CheckCircle2, 
  Copy, 
  Check, 
  ShieldCheck, 
  ArrowRight,
  Zap,
  Globe
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface ConnectGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMerchantId?: string;
  onGatewayLinked?: (gatewayDetails: { provider: string; merchantId: string; keyId: string }) => void;
}

export const ConnectGatewayModal: React.FC<ConnectGatewayModalProps> = ({
  isOpen,
  onClose,
  currentMerchantId = 'MCH_982401',
  onGatewayLinked
}) => {
  const [provider, setProvider] = useState('Razorpay');
  const [merchantId, setMerchantId] = useState(currentMerchantId);
  const [keyId, setKeyId] = useState(`rzp_live_${Math.floor(100000 + Math.random() * 900000)}`);
  const [keySecret, setKeySecret] = useState('••••••••••••••••••••••••');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const webhookUrl = 'http://127.0.0.1:8000/api/ingest/transaction';

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccessMsg(`Successfully linked ${provider} Gateway (Merchant ID: ${merchantId})!`);
      if (onGatewayLinked) {
        onGatewayLinked({ provider, merchantId, keyId });
      }
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1200);
    }, 600);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Link Payment Gateway & Merchant ID">
      <form onSubmit={handleSubmit} className="space-y-5 text-xs">
        {/* Banner */}
        <div className="p-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl text-white space-y-2 border border-blue-800/60 shadow-lg">
          <div className="flex items-center gap-2 font-bold text-sm text-blue-200">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            Automatic Telemetry Sync
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Link your payment gateway API keys or merchant ID to automatically ingest failed transactions into your isolated merchant workspace.
          </p>
        </div>

        {successMsg && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 rounded-xl flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            {successMsg}
          </div>
        )}

        {/* Provider Selector */}
        <div>
          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Payment Gateway Provider</label>
          <div className="grid grid-cols-3 gap-2">
            {['Razorpay', 'Stripe', 'PayU', 'Cashfree', 'PayPal', 'Custom Webhook'].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setProvider(p)}
                className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all ${
                  provider === p
                    ? 'border-blue-500 bg-blue-600/10 text-blue-600 dark:text-blue-400'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Merchant ID & Key ID */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Company Merchant ID</label>
            <div className="relative">
              <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={merchantId}
                onChange={(e) => setMerchantId(e.target.value)}
                required
                placeholder="e.g. MCH_982401"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Gateway API Key ID</label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={keyId}
                onChange={(e) => setKeyId(e.target.value)}
                required
                placeholder="rzp_live_XXXXXXXX"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-mono font-bold"
              />
            </div>
          </div>
        </div>

        {/* Key Secret */}
        <div>
          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">API Key Secret (Encrypted)</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="password"
              value={keySecret}
              onChange={(e) => setKeySecret(e.target.value)}
              required
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-mono"
            />
          </div>
        </div>

        {/* Webhook Endpoint Box */}
        <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-blue-500" />
              Gateway Webhook URL Endpoint
            </span>
            <button
              type="button"
              onClick={handleCopyWebhook}
              className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied!' : 'Copy URL'}
            </button>
          </div>
          <div className="p-2 bg-slate-200 dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-700 font-mono text-[10px] text-slate-800 dark:text-slate-300 truncate select-all">
            {webhookUrl}
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={loading}
            icon={<ArrowRight className="w-4 h-4" />}
          >
            Connect & Sync Gateway
          </Button>
        </div>
      </form>
    </Modal>
  );
};
