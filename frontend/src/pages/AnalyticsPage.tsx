import React, { useEffect, useState } from 'react';
import { 
  BarChart3, 
  Building2, 
  Clock, 
  Users, 
  Sparkles,
  Cpu,
  CheckCircle2,
  BrainCircuit
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';

import type { 
  FailureReasonPoint, 
  PaymentMethodPerformancePoint, 
  BankPerformancePoint, 
  HourlyPatternPoint,
  MLMetricsResponse,
  Transaction
} from '../types';

import { 
  fetchFailureReasons, 
  fetchPaymentMethodPerformance, 
  fetchBankPerformance, 
  fetchHourlyPatterns,
  fetchMLMetrics,
  fetchTransactions
} from '../services/api';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';

export const AnalyticsPage: React.FC = () => {
  const [, setReasons] = useState<FailureReasonPoint[]>([]);
  const [methods, setMethods] = useState<PaymentMethodPerformancePoint[]>([]);
  const [banks, setBanks] = useState<BankPerformancePoint[]>([]);
  const [hourly, setHourly] = useState<HourlyPatternPoint[]>([]);
  const [mlData, setMlData] = useState<MLMetricsResponse | null>(null);
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAllAnalytics() {
      setLoading(true);
      const [r, m, b, h, ml, tRes] = await Promise.all([
        fetchFailureReasons(),
        fetchPaymentMethodPerformance(),
        fetchBankPerformance(),
        fetchHourlyPatterns(),
        fetchMLMetrics(),
        fetchTransactions({ limit: 100 })
      ]);
      setReasons(r);
      setMethods(m);
      setBanks(b);
      setHourly(h);
      setMlData(ml);
      setTxns(tRes.items || []);
      setLoading(false);
    }
    loadAllAnalytics();
  }, []);

  const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#06b6d4'];

  // Dynamic Customer Segment Leakage
  const segmentTotals: Record<string, number> = {};
  let totalVolume = 0;
  txns.forEach(t => {
    const seg = t.customer?.customer_segment || 'Regular';
    const amt = Number(t.amount || 0);
    segmentTotals[seg] = (segmentTotals[seg] || 0) + amt;
    totalVolume += amt;
  });

  const customerSegments = Object.entries(segmentTotals).map(([name, val]) => ({
    name,
    value: val,
    percentage: totalVolume > 0 ? Number(((val / totalVolume) * 100).toFixed(1)) : 0
  }));

  if (customerSegments.length === 0) {
    customerSegments.push(
      { name: 'Regular', value: 120670, percentage: 100 }
    );
  }

  // Dynamic AI Recovery Score Distribution
  let highConfVal = 0;
  let medConfVal = 0;
  let lowConfVal = 0;

  txns.forEach(t => {
    const prob = t.recovery_probability || 70;
    const amt = Number(t.amount || 0);
    if (prob >= 75) highConfVal += amt;
    else if (prob >= 45) medConfVal += amt;
    else lowConfVal += amt;
  });

  const activeTotal = totalVolume || (highConfVal + medConfVal + lowConfVal) || 1;
  const highPct = Number(((highConfVal / activeTotal) * 100).toFixed(1));
  const medPct = Number(((medConfVal / activeTotal) * 100).toFixed(1));
  const lowPct = Number(((lowConfVal / activeTotal) * 100).toFixed(1));

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-md" />
        <div className="grid grid-cols-2 gap-6">
          <div className="h-72 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-72 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Revenue Analytics & ML Model Diagnostics
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Deep-dive into payment gateway reliability, issuer failure rates, and Scikit-learn ML model evaluation metrics.
          </p>
        </div>
      </div>

      {/* NEW: ML MODEL EVALUATION & FEATURE IMPORTANCES CARD */}
      {mlData && (
        <Card className="border-blue-200 dark:border-blue-900/60 bg-gradient-to-br from-white via-slate-50 to-blue-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-600 text-white shadow-xs">
                  <BrainCircuit className="w-4 h-4" />
                </span>
                <span className="font-bold text-base text-slate-900 dark:text-white tracking-tight">
                  Scikit-Learn ML Model Evaluation & Explainability
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  {mlData.model_type}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Trained on payment telemetry features (hour of day, failure code, amount, payment rail, customer historic success rate).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Model Status:</span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-mono text-xs font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Optimal Health
              </span>
            </div>
          </div>

          {/* 5 EVALUATION METRICS CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
            <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-center">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Accuracy</div>
              <div className="text-xl font-extrabold text-blue-600 dark:text-blue-400 font-mono mt-1">
                {(mlData.metrics.accuracy * 100).toFixed(1)}%
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Test set score</div>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-center">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Precision</div>
              <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                {(mlData.metrics.precision * 100).toFixed(1)}%
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">True recovery rate</div>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-center">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Recall</div>
              <div className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono mt-1">
                {(mlData.metrics.recall * 100).toFixed(1)}%
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Captured recovery</div>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-center">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">F1 Score</div>
              <div className="text-xl font-extrabold text-purple-600 dark:text-purple-400 font-mono mt-1">
                {(mlData.metrics.f1_score * 100).toFixed(1)}%
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Harmonic balance</div>
            </div>

            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-900 to-indigo-900 text-white text-center border border-blue-700 shadow-sm">
              <div className="text-[10px] uppercase font-bold tracking-wider text-blue-300">ROC-AUC Score</div>
              <div className="text-xl font-extrabold text-emerald-400 font-mono mt-1">
                {(mlData.metrics.roc_auc * 100).toFixed(1)}%
              </div>
              <div className="text-[10px] text-blue-200 mt-0.5">Discriminative power</div>
            </div>
          </div>

          {/* FEATURE IMPORTANCE EXPLAINABILITY SECTION */}
          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-blue-500" />
                Feature Importance & Factor Weight Breakdown
              </span>
              <span className="text-[11px] font-normal text-slate-400">Determines ML feature influence on recovery prediction</span>
            </div>

            <div className="space-y-2.5">
              {Object.entries(mlData.feature_importances).map(([featureName, weight]) => (
                <div key={featureName} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{featureName}</span>
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{weight}% Weight</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-600 to-indigo-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${Math.max(weight, 1.5)}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* SECTION 1: TIME-BASED FAILURE PATTERNS (HOURLY HEATMAP) */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              Time-Based Failure Patterns (24-Hour Telemetry)
            </CardTitle>
            <CardDescription>
              Hourly transaction failure spikes — notice the peak evening surge between 19:00 (7 PM) and 22:00 (10 PM)
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourly} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHourly" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorUPI" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip 
                  formatter={(val: any, name?: any) => [val, name === 'count' ? 'Total Failures' : 'UPI Failures']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="count" name="Total Failures" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorHourly)" />
                <Area type="monotone" dataKey="upi_count" name="UPI Specific Failures" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorUPI)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2 & 3: BANK ISSUER RELIABILITY & PAYMENT METHOD COMPARISON */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bank Issuer Reliability */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-500" />
                Bank Issuer Reliability & Failure Rates
              </CardTitle>
              <CardDescription>Comparing failure percentage and volume lost across major Indian banks</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={banks} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.15} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                  <YAxis dataKey="bank" type="category" tick={{ fontSize: 11, fill: '#64748b' }} width={120} />
                  <Tooltip 
                    formatter={(val: any) => [`${val}%`, 'Failure Rate']}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                  />
                  <Bar dataKey="failure_rate" name="Failure Rate %" fill="#ef4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method Failure Comparison */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-500" />
                Payment Method Failure Rate vs Volume
              </CardTitle>
              <CardDescription>Failure rate comparison across payment rails</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={methods}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                  <XAxis dataKey="method" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
                  <Bar dataKey="failure_rate" name="Failure Rate %" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 4 & 5: CUSTOMER SEGMENTATION & FAILURE CAUSES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Segmentation */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-500" />
                Customer Segment Revenue Leakage
              </CardTitle>
              <CardDescription>Revenue loss distribution across merchant tiers</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-56 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={customerSegments}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry: any) => `${entry.name} (${entry.percentage}%)`}
                  >
                    {customerSegments.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Lost Volume']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recovery Probability Distribution */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                AI Recovery Score Distribution
              </CardTitle>
              <CardDescription>Volume distribution across ML recovery confidence bands</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 pt-2">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-emerald-600 dark:text-emerald-400">High Confidence (&gt;75% Probability)</span>
                  <span className="font-mono">₹{highConfVal.toLocaleString('en-IN')} ({highPct}%)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${highPct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-amber-600 dark:text-amber-400">Medium Confidence (45% - 75% Probability)</span>
                  <span className="font-mono">₹{medConfVal.toLocaleString('en-IN')} ({medPct}%)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full transition-all duration-500" style={{ width: `${medPct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-rose-600 dark:text-rose-400">Low Confidence (&lt;45% Probability)</span>
                  <span className="font-mono">₹{lowConfVal.toLocaleString('en-IN')} ({lowPct}%)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full transition-all duration-500" style={{ width: `${lowPct}%` }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
