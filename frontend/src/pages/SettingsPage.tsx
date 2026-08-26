import React, { useState } from 'react';
import { 
  Settings, 
  User, 
  Sliders, 
  Sparkles, 
  Moon, 
  Sun, 
  Save, 
  CheckCircle,
  Key
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { fetchSettings, updateSettings } from '../services/api';

export const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useTheme();

  // Profile Form
  const [name, setName] = useState('Payment Operations Lead');
  const [email, setEmail] = useState('admin@recoverai.io');
  const role = 'Administrator';

  // Recovery Rules
  const [autoRetry, setAutoRetry] = useState(true);
  const [maxRetries, setMaxRetries] = useState('3');
  const [highValueThreshold, setHighValueThreshold] = useState('50000');

  // AI Model Settings
  const [confidenceThreshold, setConfidenceThreshold] = useState(75);
  const [mlMode, setMlMode] = useState('Balanced');

  const [savedMsg, setSavedMsg] = useState(false);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    async function loadSettings() {
      try {
        const data = await fetchSettings();
        if (data) {
          setAutoRetry(data.auto_retry_enabled);
          setConfidenceThreshold(data.minimum_recovery_probability);
          setMaxRetries(String(data.maximum_retry_attempts));
        }
      } catch (err) {
        console.warn("Could not load backend settings:", err);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings({
        auto_retry_enabled: autoRetry,
        minimum_recovery_probability: confidenceThreshold,
        maximum_retry_attempts: parseInt(maxRetries, 10) || 3,
        retry_delay_minutes: 120,
        email_recovery_enabled: true
      });
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 3000);
    } catch (err: any) {
      alert(`Error saving settings: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Toast */}
      {savedMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-500/40 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">Settings saved successfully!</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Platform Settings & Recovery Rules
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure automated retry schedules, ML model thresholds, notification alerts, and theme preferences.
          </p>
        </div>
        <Button variant="primary" loading={saving} icon={<Save className="w-4 h-4" />} onClick={handleSave}>
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PROFILE SETTINGS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-blue-500" />
              Profile Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Role / Permissions</label>
              <input
                type="text"
                value={role}
                disabled
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 cursor-not-allowed"
              />
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 font-medium">Gateway API Secret Key</span>
              <span className="font-mono text-emerald-600 font-bold flex items-center gap-1">
                <Key className="w-3.5 h-3.5" />
                rzp_live_••••8924
              </span>
            </div>
          </CardContent>
        </Card>

        {/* RECOVERY RULES CONFIGURATION */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Sliders className="w-4 h-4 text-emerald-500" />
              Automated Recovery Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">Enable Automated Off-Peak Retries</div>
                <div className="text-[11px] text-slate-500">Automatically retry failed network/timeout transactions</div>
              </div>
              <input
                type="checkbox"
                checked={autoRetry}
                onChange={(e) => setAutoRetry(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded cursor-pointer"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Max Retry Attempts per Transaction</label>
              <select
                value={maxRetries}
                onChange={(e) => setMaxRetries(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              >
                <option value="1">1 Attempt</option>
                <option value="2">2 Attempts</option>
                <option value="3">3 Attempts (Recommended)</option>
                <option value="5">5 Attempts</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">High-Value Threshold (INR ₹)</label>
              <input
                type="number"
                value={highValueThreshold}
                onChange={(e) => setHighValueThreshold(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>
          </CardContent>
        </Card>

        {/* AI & ML MODEL SETTINGS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4 text-purple-500" />
              AI Model Sensitivity Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between font-semibold text-slate-800 dark:text-slate-200 mb-1">
                <span>High-Confidence Recovery Threshold</span>
                <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{confidenceThreshold}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="95"
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="text-[11px] text-slate-500 mt-1">
                Transactions scoring above {confidenceThreshold}% will be flagged for automated immediate retry execution.
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Prediction Engine Calibration Mode</label>
              <div className="grid grid-cols-3 gap-2">
                {['Conservative', 'Balanced', 'Aggressive'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setMlMode(mode)}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-semibold ${
                      mlMode === mode
                        ? 'bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* THEME PREFERENCES */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Moon className="w-4 h-4 text-amber-500" />
              Visual Theme Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  theme === 'light'
                    ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-bold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span>Light Mode (Default)</span>
                </div>
                {theme === 'light' && <CheckCircle className="w-4 h-4 text-blue-600" />}
              </button>

              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  theme === 'dark'
                    ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-bold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Moon className="w-4 h-4 text-slate-400" />
                  <span>Dark Mode</span>
                </div>
                {theme === 'dark' && <CheckCircle className="w-4 h-4 text-blue-600" />}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
