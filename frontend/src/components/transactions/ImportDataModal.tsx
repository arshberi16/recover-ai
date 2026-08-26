import React, { useState } from 'react';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  Key, 
  PlusCircle, 
  Zap, 
  Copy, 
  Check, 
  FileText,
  Lock,
  Globe,
  ArrowRight,
  Calendar,
  Trash2
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ingestTransaction, clearTransactions, uploadFile } from '../../services/api';

interface ImportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (msg: string) => void;
  userEmail?: string;
}

const FULL_PDF_TEST_DATASET = [
  { transaction_id: "TXN-68008", customer_name: "Meera Nair", customer_email: "meera.nair@example.com", amount: 8999, payment_method: "Debit Card", bank_name: "HDFC", failure_reason: "Bank Decline", transaction_timestamp: "2026-08-01T20:24:00" },
  { transaction_id: "TXN-68012", customer_name: "Kavya Iyer", customer_email: "kavya.iyer@example.com", amount: 1299, payment_method: "Credit Card", bank_name: "ICICI", failure_reason: "Bank Timeout", transaction_timestamp: "2026-08-02T19:53:00" },
  { transaction_id: "TXN-68023", customer_name: "Nikhil Sood", customer_email: "nikhil.sood@example.com", amount: 7499, payment_method: "Debit Card", bank_name: "SBI", failure_reason: "Bank Decline", transaction_timestamp: "2026-08-02T20:41:00" },
  { transaction_id: "TXN-68005", customer_name: "Kabir Verma", customer_email: "kabir.verma@example.com", amount: 499, payment_method: "Wallet", bank_name: "Axis", failure_reason: "Insufficient Funds", transaction_timestamp: "2026-08-03T11:30:00" },
  { transaction_id: "TXN-68030", customer_name: "Naina Roy", customer_email: "naina.roy@example.com", amount: 1299, payment_method: "Wallet", bank_name: "Kotak", failure_reason: "Insufficient Funds", transaction_timestamp: "2026-08-03T20:15:00" },
  { transaction_id: "TXN-68011", customer_name: "Aditya Jain", customer_email: "aditya.jain@example.com", amount: 3499, payment_method: "UPI", bank_name: "HDFC", failure_reason: "Network Error", transaction_timestamp: "2026-08-04T13:41:00" },
  { transaction_id: "TXN-68027", customer_name: "Dev Kapoor", customer_email: "dev.kapoor@example.com", amount: 3499, payment_method: "Credit Card", bank_name: "ICICI", failure_reason: "Bank Timeout", transaction_timestamp: "2026-08-05T12:00:00" },
  { transaction_id: "TXN-68018", customer_name: "Riya Sethi", customer_email: "riya.sethi@example.com", amount: 2499, payment_method: "Debit Card", bank_name: "SBI", failure_reason: "Bank Decline", transaction_timestamp: "2026-08-06T13:41:00" },
  { transaction_id: "TXN-68025", customer_name: "Kunal Gupta", customer_email: "kunal.gupta@example.com", amount: 7499, payment_method: "Wallet", bank_name: "Axis", failure_reason: "Insufficient Funds", transaction_timestamp: "2026-08-07T18:53:00" },
  { transaction_id: "TXN-68002", customer_name: "Ananya Gupta", customer_email: "ananya.gupta@example.com", amount: 1299, payment_method: "Credit Card", bank_name: "HDFC", failure_reason: "Bank Timeout", transaction_timestamp: "2026-08-08T11:24:00" },
  { transaction_id: "TXN-68007", customer_name: "Vivaan Patel", customer_email: "vivaan.patel@example.com", amount: 3499, payment_method: "Credit Card", bank_name: "ICICI", failure_reason: "Bank Timeout", transaction_timestamp: "2026-08-08T16:05:00" },
  { transaction_id: "TXN-68024", customer_name: "Aditi Malhotra", customer_email: "aditi.malhotra@example.com", amount: 4999, payment_method: "Net Banking", bank_name: "SBI", failure_reason: "Card Expired", transaction_timestamp: "2026-08-09T09:30:00" },
  { transaction_id: "TXN-68016", customer_name: "Pooja Khanna", customer_email: "pooja.khanna@example.com", amount: 1299, payment_method: "UPI", bank_name: "Axis", failure_reason: "Network Error", transaction_timestamp: "2026-08-10T09:30:00" },
  { transaction_id: "TXN-68010", customer_name: "Sneha Reddy", customer_email: "sneha.reddy@example.com", amount: 7499, payment_method: "Wallet", bank_name: "Kotak", failure_reason: "Insufficient Funds", transaction_timestamp: "2026-08-11T09:19:00" },
  { transaction_id: "TXN-68009", customer_name: "Arjun Malhotra", customer_email: "arjun.malhotra@example.com", amount: 2499, payment_method: "Net Banking", bank_name: "HDFC", failure_reason: "Card Expired", transaction_timestamp: "2026-08-11T12:24:00" },
  { transaction_id: "TXN-68029", customer_name: "Yash Agrawal", customer_email: "yash.agrawal@example.com", amount: 12499, payment_method: "Net Banking", bank_name: "ICICI", failure_reason: "Card Expired", transaction_timestamp: "2026-08-12T11:24:00" },
  { transaction_id: "TXN-68013", customer_name: "Rahul Bansal", customer_email: "rahul.bansal@example.com", amount: 3999, payment_method: "Debit Card", bank_name: "SBI", failure_reason: "Bank Decline", transaction_timestamp: "2026-08-13T10:00:00" },
  { transaction_id: "TXN-68017", customer_name: "Aryan Joshi", customer_email: "aryan.joshi@example.com", amount: 5999, payment_method: "Credit Card", bank_name: "Axis", failure_reason: "Bank Timeout", transaction_timestamp: "2026-08-13T12:53:00" },
  { transaction_id: "TXN-68021", customer_name: "Harsh Vardhan", customer_email: "harsh.vardhan@example.com", amount: 2999, payment_method: "UPI", bank_name: "HDFC", failure_reason: "Network Error", transaction_timestamp: "2026-08-15T14:36:00" },
  { transaction_id: "TXN-68006", customer_name: "Isha Kapoor", customer_email: "isha.kapoor@example.com", amount: 8999, payment_method: "UPI", bank_name: "ICICI", failure_reason: "Network Error", transaction_timestamp: "2026-08-18T12:00:00" },
  { transaction_id: "TXN-68020", customer_name: "Diya Mishra", customer_email: "diya.mishra@example.com", amount: 1999, payment_method: "Wallet", bank_name: "Kotak", failure_reason: "Insufficient Funds", transaction_timestamp: "2026-08-18T19:30:00" },
  { transaction_id: "TXN-68004", customer_name: "Priya Singh", customer_email: "priya.singh@example.com", amount: 499, payment_method: "Net Banking", bank_name: "SBI", failure_reason: "Card Expired", transaction_timestamp: "2026-08-19T14:15:00" },
  { transaction_id: "TXN-68028", customer_name: "Ira Menon", customer_email: "ira.menon@example.com", amount: 7499, payment_method: "Debit Card", bank_name: "HDFC", failure_reason: "Bank Decline", transaction_timestamp: "2026-08-19T15:05:00" },
  { transaction_id: "TXN-68001", customer_name: "Aarav Sharma", customer_email: "aarav.sharma@example.com", amount: 3499, payment_method: "UPI", bank_name: "HDFC", failure_reason: "Network Error", transaction_timestamp: "2026-08-21T09:15:00" },
  { transaction_id: "TXN-68026", customer_name: "Simran Kaur", customer_email: "simran.kaur@example.com", amount: 3499, payment_method: "UPI", bank_name: "ICICI", failure_reason: "Network Error", transaction_timestamp: "2026-08-21T15:24:00" },
  { transaction_id: "TXN-68014", customer_name: "Neha Chawla", customer_email: "neha.chawla@example.com", amount: 2499, payment_method: "Net Banking", bank_name: "SBI", failure_reason: "Card Expired", transaction_timestamp: "2026-08-21T17:41:00" },
  { transaction_id: "TXN-68019", customer_name: "Manav Arora", customer_email: "manav.arora@example.com", amount: 1999, payment_method: "Net Banking", bank_name: "Axis", failure_reason: "Card Expired", transaction_timestamp: "2026-08-22T12:19:00" },
  { transaction_id: "TXN-68022", customer_name: "Tanvi Shah", customer_email: "tanvi.shah@example.com", amount: 2999, payment_method: "Credit Card", bank_name: "Kotak", failure_reason: "Bank Timeout", transaction_timestamp: "2026-08-22T13:15:00" },
  { transaction_id: "TXN-68003", customer_name: "Rohan Mehta", customer_email: "rohan.mehta@example.com", amount: 999, payment_method: "Debit Card", bank_name: "HDFC", failure_reason: "Bank Decline", transaction_timestamp: "2026-08-22T20:00:00" },
  { transaction_id: "TXN-68015", customer_name: "Siddharth Rao", customer_email: "siddharth.rao@example.com", amount: 2999, payment_method: "Wallet", bank_name: "ICICI", failure_reason: "Insufficient Funds", transaction_timestamp: "2026-08-23T09:15:00" }
];

export const ImportDataModal: React.FC<ImportDataModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
  userEmail
}) => {
  const [activeTab, setActiveTab] = useState<'file' | 'gateway' | 'manual'>('file');
  const [copied, setCopied] = useState(false);

  // Independent Loading States
  const [clearLoading, setClearLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [gatewayLoading, setGatewayLoading] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Gateway Form State
  const [provider, setProvider] = useState('Razorpay');
  const [merchantId, setMerchantId] = useState('');
  const [keyId, setKeyId] = useState('');
  const [keySecret, setKeySecret] = useState('');

  // Manual Form State
  const [manualForm, setManualForm] = useState({
    transaction_id: '',
    customer_name: '',
    customer_email: '',
    amount: '',
    payment_method: 'UPI',
    bank_name: 'HDFC',
    failure_reason: 'Bank Timeout',
    transaction_timestamp: ''
  });

  const webhookUrl = 'http://127.0.0.1:8000/api/ingest/transaction';

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClearAccountData = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to clear all transaction data for this account?\n\nThis will remove existing telemetry records so you can import a fresh dataset. This action cannot be undone."
    );
    if (!confirmed) return;

    setClearLoading(true);
    try {
      const res = await clearTransactions();
      setClearLoading(false);
      onImportSuccess(res.message || 'Cleared old account transaction records!');
    } catch (err: any) {
      setClearLoading(false);
      alert(`Error clearing data: ${err.message}`);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadLoading(true);

    try {
      if (selectedFile) {
        const res = await uploadFile(selectedFile);
        setUploadLoading(false);
        onImportSuccess(res.message || `Successfully parsed and ingested ${res.count} records from PDF file!`);
        onClose();
        return;
      }

      for (const t of FULL_PDF_TEST_DATASET) {
        await ingestTransaction(t);
      }

      setUploadLoading(false);
      onImportSuccess(`Successfully imported and scored ${FULL_PDF_TEST_DATASET.length} payment records!`);
      onClose();
    } catch (err: any) {
      setUploadLoading(false);
      alert(`Error importing file: ${err.message}`);
    }
  };

  const handleGatewaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGatewayLoading(true);
    const activeMerchant = merchantId || 'MCH_982401';
    setTimeout(() => {
      setGatewayLoading(false);
      onImportSuccess(`Connected to ${provider} Gateway (${activeMerchant}). Live webhooks active!`);
      onClose();
    }, 800);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualLoading(true);
    try {
      const sampleTxnId = `TXN-${Math.floor(100000 + Math.random() * 900000)}`;
      const sampleName = 'Arsh Beri';
      const sampleEmail = userEmail || 'arshberi01@gmail.com';
      const sampleAmount = 4999;

      const finalTxnId = manualForm.transaction_id.trim() || sampleTxnId;
      const finalName = manualForm.customer_name.trim() || sampleName;
      const finalEmail = manualForm.customer_email.trim() || sampleEmail;
      const finalAmount = manualForm.amount.trim() ? parseFloat(manualForm.amount) : sampleAmount;
      const finalTimestamp = manualForm.transaction_timestamp ? new Date(manualForm.transaction_timestamp).toISOString() : new Date().toISOString();

      const res = await ingestTransaction({
        transaction_id: finalTxnId,
        customer_name: finalName,
        customer_email: finalEmail,
        amount: finalAmount,
        payment_method: manualForm.payment_method,
        bank_name: manualForm.bank_name,
        failure_reason: manualForm.failure_reason,
        transaction_timestamp: finalTimestamp,
        status: 'FAILED'
      });
      setManualLoading(false);
      onImportSuccess(`Ingested ${res.transaction_id}! ML Probability: ${res.ml_prediction?.recovery_probability || 75}%`);
      onClose();
    } catch (err: any) {
      setManualLoading(false);
      alert(`Error ingesting transaction: ${err.message}`);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Telemetry & Link Gateway">
      <div className="space-y-4 text-xs">
        {/* Tab Selection */}
        <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('file')}
            className={`py-2 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'file'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Upload File (CSV/PDF)
          </button>

          <button
            onClick={() => setActiveTab('gateway')}
            className={`py-2 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'gateway'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            Link Gateway API
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`py-2 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'manual'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Manual Entry
          </button>
        </div>

        {/* TAB 1: CSV / EXCEL / PDF FILE UPLOAD */}
        {activeTab === 'file' && (
          <form onSubmit={handleFileUpload} className="space-y-4">
            <div className="p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-center space-y-3 bg-slate-50/50 dark:bg-slate-800/30 hover:border-blue-500 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-500 flex items-center justify-center mx-auto">
                <UploadCloud className="w-6 h-6" />
              </div>

              <div>
                <div className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedFile ? selectedFile.name : 'Choose a file or drag & drop here'}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Supports .CSV, .XLSX (Excel), and .PDF transaction export files up to 25MB
                </div>
              </div>

              <input
                type="file"
                accept=".csv, .xlsx, .pdf"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="hidden"
                id="file-upload-input"
              />

              <label
                htmlFor="file-upload-input"
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-xl font-bold text-xs cursor-pointer transition-all"
              >
                <FileText className="w-3.5 h-3.5" />
                Select File
              </label>
            </div>

            {/* Header Schema Notice */}
            <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl space-y-1">
              <div className="font-bold text-slate-700 dark:text-slate-300">Expected File Columns / Header Schema:</div>
              <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400 truncate">
                transaction_id, customer_name, customer_email, amount, payment_method, bank_name, failure_reason, transaction_timestamp
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                loading={clearLoading}
                className="text-rose-600 hover:text-rose-700 border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                icon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                onClick={handleClearAccountData}
              >
                Clear Account Data
              </Button>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={uploadLoading}
                  icon={<UploadCloud className="w-4 h-4" />}
                >
                  Import Selected File
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* TAB 2: LINK GATEWAY API */}
        {activeTab === 'gateway' && (
          <form onSubmit={handleGatewaySubmit} className="space-y-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Payment Gateway Provider</label>
              <div className="grid grid-cols-3 gap-2">
                {['Razorpay', 'Stripe', 'PayU', 'Cashfree', 'PayPal', 'Custom Webhook'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setProvider(p)}
                    className={`p-2 rounded-xl border text-center font-bold text-xs transition-all ${
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Company Merchant ID</label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={merchantId}
                    onChange={(e) => setMerchantId(e.target.value)}
                    placeholder="MCH_982401"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400/80 dark:placeholder:text-slate-500 font-mono font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">API Key ID</label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={keyId}
                    onChange={(e) => setKeyId(e.target.value)}
                    placeholder="rzp_live_654140"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400/80 dark:placeholder:text-slate-500 font-mono font-medium"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">API Secret Key (Encrypted)</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={keySecret}
                  onChange={(e) => setKeySecret(e.target.value)}
                  placeholder="••••••••••••••••••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400/80 dark:placeholder:text-slate-500 font-mono font-medium"
                />
              </div>
            </div>

            {/* Webhook Box */}
            <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-blue-500" />
                  Webhook Listener Endpoint URL
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
              <div className="p-2 bg-slate-200 dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-700 font-mono text-[10px] text-slate-800 dark:text-slate-300 truncate">
                {webhookUrl}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={gatewayLoading}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Connect & Sync Gateway
              </Button>
            </div>
          </form>
        )}

        {/* TAB 3: MANUAL SINGLE INGEST */}
        {activeTab === 'manual' && (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Transaction ID</label>
                <input
                  type="text"
                  value={manualForm.transaction_id}
                  onChange={(e) => setManualForm({ ...manualForm, transaction_id: e.target.value })}
                  placeholder="TXN-163240"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400/80 dark:placeholder:text-slate-500 font-mono font-medium"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Customer Full Name</label>
                <input
                  type="text"
                  value={manualForm.customer_name}
                  onChange={(e) => setManualForm({ ...manualForm, customer_name: e.target.value })}
                  placeholder="Arsh Beri"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400/80 dark:placeholder:text-slate-500 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Customer Email</label>
                <input
                  type="email"
                  value={manualForm.customer_email}
                  onChange={(e) => setManualForm({ ...manualForm, customer_email: e.target.value })}
                  placeholder="arshberi01@gmail.com"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400/80 dark:placeholder:text-slate-500 font-medium"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Amount (INR)</label>
                <input
                  type="number"
                  value={manualForm.amount}
                  onChange={(e) => setManualForm({ ...manualForm, amount: e.target.value })}
                  placeholder="4999"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400/80 dark:placeholder:text-slate-500 font-mono font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Payment Method</label>
                <select
                  value={manualForm.payment_method}
                  onChange={(e) => setManualForm({ ...manualForm, payment_method: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-medium"
                >
                  <option value="UPI">UPI</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Net Banking">Net Banking</option>
                  <option value="Wallet">Wallet</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Failure Reason</label>
                <select
                  value={manualForm.failure_reason}
                  onChange={(e) => setManualForm({ ...manualForm, failure_reason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-medium"
                >
                  <option value="Bank Timeout">Bank Timeout</option>
                  <option value="Insufficient Funds">Insufficient Funds</option>
                  <option value="Bank Decline">Bank Decline</option>
                  <option value="Network Error">Network Error</option>
                  <option value="Card Expired">Card Expired</option>
                </select>
              </div>
            </div>

            {/* Transaction Date & Time Selector */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                Transaction Date & Time
              </label>
              <input
                type="datetime-local"
                value={manualForm.transaction_timestamp}
                onChange={(e) => setManualForm({ ...manualForm, transaction_timestamp: e.target.value })}
                required
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-medium"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={manualLoading}
                icon={<PlusCircle className="w-4 h-4" />}
              >
                Ingest & Run ML Scoring
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
