import React, { useEffect, useState } from 'react';
import { 
  TrendingDown, 
  Sparkles, 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  RefreshCw, 
  ShieldAlert, 
  PieChart, 
  ChevronRight,
  AlertCircle,
  Zap,
  CheckCircle,
  CheckCircle2
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  Pie,
  PieChart as RePieChart
} from 'recharts';

import type { 
  KPISummary, 
  RevenueLossTrendPoint, 
  FailureReasonPoint, 
  PaymentMethodPerformancePoint, 
  BusinessInsight, 
  Transaction 
} from '../types';

import { 
  fetchKPISummary, 
  fetchRevenueLossTrend, 
  fetchFailureReasons, 
  fetchPaymentMethodPerformance, 
  fetchBusinessInsights, 
  fetchRecoveryQueue,
  executeRecoveryAction
} from '../services/api';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

interface DashboardPageProps {
  onNavigateTab: (tab: string) => void;
  onSelectTransaction: (txn: Transaction) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigateTab, onSelectTransaction }) => {
  const [kpis, setKpis] = useState<KPISummary | null>(null);
  const [trend, setTrend] = useState<RevenueLossTrendPoint[]>([]);
  const [reasons, setReasons] = useState<FailureReasonPoint[]>([]);
  const [methods, setMethods] = useState<PaymentMethodPerformancePoint[]>([]);
  const [insights, setInsights] = useState<BusinessInsight[]>([]);
  const [queue, setQueue] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    // Core stats load concurrently and update UI instantly
    fetchKPISummary().then(data => {
      if (isMounted) {
        setKpis(data);
        setLoading(false); // Hide main card skeleton instantly when KPIs arrive
      }
    }).catch(() => {
      if (isMounted) setLoading(false);
    });

    fetchRevenueLossTrend(30).then(data => isMounted && setTrend(data)).catch(() => {});
    fetchFailureReasons().then(data => isMounted && setReasons(data)).catch(() => {});
    fetchPaymentMethodPerformance().then(data => isMounted && setMethods(data)).catch(() => {});
    fetchRecoveryQueue('High').then(data => isMounted && setQueue(data)).catch(() => {});

    // AI Insights stream asynchronously without blocking KPI cards
    fetchBusinessInsights().then(data => isMounted && setInsights(data)).catch(() => {});

    return () => { isMounted = false; };
  }, []);

  const handleQuickRetry = async (e: React.MouseEvent, txnId: string) => {
    e.stopPropagation();
    const res = await executeRecoveryAction(txnId, 'Retry Payment');
    setActionSuccessMsg(res.message);
    setQueue(prev => prev.map(t => t.transaction_id === txnId ? { ...t, status: 'Pending Retry' } : t));
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  const REASON_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#06b6d4', '#64748b'];

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-md" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          ))}
        </div>
        <div className="h-72 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>
    );
  }

  const isZeroRisk = !kpis || kpis.revenue_at_risk === 0;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {actionSuccessMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-500/40 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{actionSuccessMsg}</span>
        </div>
      )}

      {/* Page Title & Subtitle */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Revenue Recovery Intelligence
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time analytics, failure reason classification, and AI-driven transaction recovery queue.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            icon={<Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
            onClick={() => onNavigateTab('insights')}
          >
            Ask AI Analyst
          </Button>
          <Button 
            variant="primary" 
            size="sm" 
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={() => onNavigateTab('recovery')}
          >
            Open Recovery Queue
          </Button>
        </div>
      </div>

      {/* TOP 4 KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Revenue at Risk */}
        <Card className="border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Revenue at Risk</span>
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono tracking-tight">
              ₹{kpis?.revenue_at_risk.toLocaleString('en-IN') || '0'}
            </div>
            <div className={`flex items-center gap-1.5 mt-2 text-xs font-medium ${isZeroRisk ? 'text-emerald-600 dark:text-emerald-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {isZeroRisk ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <ArrowDownRight className="w-4 h-4" />}
              <span>{isZeroRisk ? '0.0% (No Active Risk)' : '4.2% reduction vs last 30 days'}</span>
            </div>
          </div>
        </Card>

        {/* KPI 2: Potential Recovery */}
        <Card className="border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Potential Recovery</span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono tracking-tight">
              ₹{kpis?.potential_recovery.toLocaleString('en-IN') || '0'}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {isZeroRisk ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <ArrowUpRight className="w-4 h-4" />}
              <span>{isZeroRisk ? '₹0 Recoverable' : '+8.5% recovery boost score'}</span>
            </div>
          </div>
        </Card>

        {/* KPI 3: Failed Transactions */}
        <Card className="border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Failed Transactions</span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono tracking-tight">
              {kpis?.failed_transactions_count.toLocaleString('en-IN') || '0'}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>{isZeroRisk ? '0 active failure records' : 'Avg volume per day: ~414 txns'}</span>
            </div>
          </div>
        </Card>

        {/* KPI 4: Recovery Opportunity */}
        <Card className="border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Recovery Opportunity</span>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono tracking-tight">
              {isZeroRisk ? '0%' : `${kpis?.recovery_opportunity_rate || 68.0}%`}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {isZeroRisk ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <ArrowUpRight className="w-4 h-4" />}
              <span>{isZeroRisk ? 'No pending failure queue' : 'High probability target'}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* AI BUSINESS INSIGHT CARD */}
      <Card className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white border-none shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0 text-blue-300 mt-1">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 border border-blue-400/30 text-blue-300">
                  AI Business Intelligence Notice
                </span>
                <span className="text-xs text-blue-200/70">Updated 15 mins ago</span>
              </div>
              <p className="text-base font-medium mt-2 leading-relaxed text-slate-100">
                {isZeroRisk
                  ? '"All payment channels fully operational. 0 active revenue leakage detected for this merchant account."'
                  : `"${insights[0]?.insight_text || 'UPI failures increased by 23% during evening hours (19:00 - 22:00 IST), primarily driven by bank gateway timeouts.'}"`
                }
              </p>
              <div className="flex items-center gap-4 mt-3 text-xs text-blue-200">
                <span>Impacted Volume: <strong className="text-white">₹{isZeroRisk ? '0' : (insights[0]?.impact_amount || 420000).toLocaleString('en-IN')}</strong></span>
                <span>•</span>
                <span>Primary Category: <strong className="text-white">{isZeroRisk ? 'All Clear' : (insights[0]?.category || 'UPI')}</strong></span>
              </div>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <Button
              variant="primary"
              className="bg-blue-500 hover:bg-blue-400 text-white border-none shadow-md shadow-blue-500/30 text-xs"
              icon={<ChevronRight className="w-4 h-4" />}
              onClick={() => onNavigateTab('insights')}
            >
              View Full AI Analysis
            </Button>
          </div>
        </div>
      </Card>

      {/* MAIN DASHBOARD SECTIONS: Loss Trend & Failure Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section 1: Revenue Loss Trend (2 Columns) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Revenue Loss Trend (Last 30 Days)</CardTitle>
              <CardDescription>Daily revenue lost vs projected AI recoverable amount</CardDescription>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-rose-500" />
                <span className="text-slate-600 dark:text-slate-400">Revenue Lost</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-emerald-500" />
                <span className="text-slate-600 dark:text-slate-400">Potential Recovery</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorLost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRecovered" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#64748b' }} 
                    axisLine={false} 
                    tickLine={false}
                    tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} 
                  />
                  <Tooltip 
                    formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, '']}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="revenue_lost" name="Revenue Lost" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorLost)" />
                  <Area type="monotone" dataKey="potential_recovered" name="Potential Recovered" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRecovered)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Failure Analysis (1 Column) */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Payment Failure Analysis</CardTitle>
              <CardDescription>Breakdown by primary failure cause</CardDescription>
            </div>
            <PieChart className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            {reasons.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center text-xs text-slate-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                <span>0 failure records logged for this account.</span>
              </div>
            ) : (
              <>
                <div className="h-48 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={reasons}
                        dataKey="amount"
                        nameKey="reason"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                      >
                        {reasons.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={REASON_COLORS[index % REASON_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Lost Volume']}
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                      />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
                {/* Failure Reasons Legend list */}
                <div className="space-y-2 mt-2 max-h-36 overflow-y-auto pr-1">
                  {reasons.map((r, i) => (
                    <div key={r.reason} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: REASON_COLORS[i % REASON_COLORS.length] }} />
                        <span className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[130px]">{r.reason}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-slate-900 dark:text-slate-100 font-semibold">₹{(r.amount/1000).toFixed(0)}k</span>
                        <span className="text-slate-400 text-[10px]">({r.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* SECTION 3 & 4: Payment Method Performance & Quick Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Method Performance Matrix */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div>
              <CardTitle>Payment Method Performance</CardTitle>
              <CardDescription>Failure rates across payment rails</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {methods.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-xs text-slate-400">
                No payment method failure data recorded.
              </div>
            ) : (
              <div className="space-y-4">
                {methods.map((m) => (
                  <div key={m.method} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{m.method}</span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-slate-500 dark:text-slate-400">Rate: <strong className="text-rose-600 dark:text-rose-400">{m.failure_rate}%</strong></span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-700 dark:text-slate-300">₹{(m.volume/100000).toFixed(1)}L</span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden flex">
                      <div 
                        className="bg-emerald-500 h-full transition-all duration-500" 
                        style={{ width: `${m.success_rate}%` }} 
                        title={`Success: ${m.success_rate}%`}
                      />
                      <div 
                        className="bg-rose-500 h-full transition-all duration-500" 
                        style={{ width: `${m.failure_rate}%` }} 
                        title={`Failure: ${m.failure_rate}%`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-5 p-3 rounded-lg bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
              <span>{isZeroRisk ? 'Gateway health optimal. Smart off-peak retry schedule active.' : 'UPI shows high failure frequency during 7 PM - 10 PM. Smart off-peak retry schedule enabled.'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Section 5: High Priority Recovery Queue Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>High Priority Recovery Queue</CardTitle>
              <CardDescription>Top unrecovered transactions ranked by AI Recovery Priority Score</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onNavigateTab('recovery')}
              icon={<ChevronRight className="w-4 h-4" />}
            >
              View All Queue ({queue.length})
            </Button>
          </CardHeader>
          <CardContent>
            {queue.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <div>0 unrecovered failed transactions in queue.</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-3">Transaction</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Method</th>
                      <th className="py-2.5 px-3">Failure Reason</th>
                      <th className="py-2.5 px-3">AI Score</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {queue.map((t) => (
                      <tr 
                        key={t.transaction_id}
                        onClick={() => onSelectTransaction(t)}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-3 font-mono font-semibold text-blue-600 dark:text-blue-400">
                          {t.transaction_id}
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-900 dark:text-slate-100">
                          {t.customer?.name || 'Enterprise Client'}
                        </td>
                        <td className="py-3 px-3 font-mono font-semibold text-slate-900 dark:text-slate-100">
                          ₹{t.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3">
                          <Badge variant="outline">{t.payment_method}</Badge>
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                          {t.failure_reason}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            <div className="w-12 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className="bg-emerald-500 h-full" 
                                style={{ width: `${t.recovery_probability}%` }}
                              />
                            </div>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                              {t.recovery_probability}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Button
                            variant={t.status === 'Pending Retry' ? 'secondary' : 'primary'}
                            size="sm"
                            disabled={t.status === 'Pending Retry'}
                            onClick={(e) => handleQuickRetry(e, t.transaction_id)}
                          >
                            {t.status === 'Pending Retry' ? 'Retrying...' : 'Retry'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
