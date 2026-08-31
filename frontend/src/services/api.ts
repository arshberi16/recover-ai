import type {
  Transaction,
  KPISummary,
  RevenueLossTrendPoint,
  FailureReasonPoint,
  PaymentMethodPerformancePoint,
  BankPerformancePoint,
  HourlyPatternPoint,
  BusinessInsight,
  PredictRequest,
  PredictResponse,
  InsightQueryResponse,
  MLMetricsResponse
} from '../types';

const getBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl) {
    let clean = envUrl.trim();
    if (clean.endsWith('/')) clean = clean.slice(0, -1);
    return clean.endsWith('/api') ? clean : `${clean}/api`;
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://recover-ai-ja36.onrender.com/api';
  }
  return 'http://127.0.0.1:8000/api';
};

const API_BASE_URL = getBaseUrl();

const apiCache = new Map<string, { timestamp: number; data: any }>();
const inFlightRequests = new Map<string, Promise<any>>();
const CACHE_TTL_MS = 60000;

function getCached<T>(key: string): T | null {
  const item = apiCache.get(key);
  if (!item) return null;
  if (Date.now() - item.timestamp > CACHE_TTL_MS) {
    apiCache.delete(key);
    return null;
  }
  return item.data as T;
}

export function getCachedValue<T>(key: string): T | null {
  return getCached<T>(key);
}

function setCached(key: string, data: any): void {
  apiCache.set(key, { timestamp: Date.now(), data });
}

async function fetchWithDeduplication<T>(cacheKey: string, fetcher: () => Promise<T>): Promise<T> {
  const cached = getCached<T>(cacheKey);
  if (cached) return cached;

  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey) as Promise<T>;
  }

  const promise = fetcher().then((data) => {
    setCached(cacheKey, data);
    inFlightRequests.delete(cacheKey);
    return data;
  }).catch((err) => {
    inFlightRequests.delete(cacheKey);
    throw err;
  });

  inFlightRequests.set(cacheKey, promise);
  return promise;
}

export const clearApiCache = () => {
  apiCache.clear();
  inFlightRequests.clear();
};

export const triggerGlobalDataRefresh = () => {
  clearApiCache();
  window.dispatchEvent(new Event('recoverai_refresh_data'));
};

const getUserEmailParam = (): string => {
  const email = localStorage.getItem('recoverai_user_email');
  return email ? `user_email=${encodeURIComponent(email)}` : '';
};

export async function fetchKPISummary(): Promise<KPISummary> {
  const p = getUserEmailParam();
  const cacheKey = `kpi_${p}`;
  return fetchWithDeduplication(cacheKey, async () => {
    const res = await fetch(`${API_BASE_URL}/analytics/kpis?${p}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch KPIs from database`);
    return await res.json();
  });
}

export async function fetchRevenueLossTrend(days = 30): Promise<RevenueLossTrendPoint[]> {
  const p = getUserEmailParam();
  const cacheKey = `trend_${days}_${p}`;
  return fetchWithDeduplication(cacheKey, async () => {
    const res = await fetch(`${API_BASE_URL}/analytics/revenue-loss-trend?days=${days}&${p}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch revenue trend from database`);
    return await res.json();
  });
}

export async function fetchFailureReasons(): Promise<FailureReasonPoint[]> {
  const p = getUserEmailParam();
  const cacheKey = `reasons_${p}`;
  return fetchWithDeduplication(cacheKey, async () => {
    const res = await fetch(`${API_BASE_URL}/analytics/failure-reasons?${p}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch failure reasons from database`);
    return await res.json();
  });
}

export async function fetchPaymentMethodPerformance(): Promise<PaymentMethodPerformancePoint[]> {
  const p = getUserEmailParam();
  const cacheKey = `pm_${p}`;
  return fetchWithDeduplication(cacheKey, async () => {
    const res = await fetch(`${API_BASE_URL}/analytics/payment-methods?${p}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch payment method stats from database`);
    return await res.json();
  });
}

export async function fetchBankPerformance(): Promise<BankPerformancePoint[]> {
  const p = getUserEmailParam();
  const cacheKey = `bank_${p}`;
  return fetchWithDeduplication(cacheKey, async () => {
    const res = await fetch(`${API_BASE_URL}/analytics/bank-performance?${p}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch bank performance stats from database`);
    return await res.json();
  });
}

export async function fetchHourlyPatterns(): Promise<HourlyPatternPoint[]> {
  const p = getUserEmailParam();
  const cacheKey = `hourly_${p}`;
  return fetchWithDeduplication(cacheKey, async () => {
    const res = await fetch(`${API_BASE_URL}/analytics/hourly-patterns?${p}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch hourly patterns from database`);
    return await res.json();
  });
}

export async function fetchBusinessInsights(): Promise<BusinessInsight[]> {
  const p = getUserEmailParam();
  const cacheKey = `insights_${p}`;
  return fetchWithDeduplication(cacheKey, async () => {
    const res = await fetch(`${API_BASE_URL}/insights?${p}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch business insights from database`);
    return await res.json();
  });
}

export async function fetchRecoveryQueueCount(): Promise<number> {
  const p = getUserEmailParam();
  const cacheKey = `queue_cnt_${p}`;
  return fetchWithDeduplication(cacheKey, async () => {
    const res = await fetch(`${API_BASE_URL}/transactions/queue/count?${p}`);
    if (!res.ok) return 0;
    const data = await res.json();
    return data.count || 0;
  });
}

export async function fetchTransactions(params?: any): Promise<{ items: Transaction[]; total: number; page: number }> {
  const searchParams = new URLSearchParams(params);
  const email = localStorage.getItem('recoverai_user_email');
  if (email && !searchParams.has('user_email')) {
    searchParams.append('user_email', email);
  }
  const cacheKey = `txns_${searchParams.toString()}`;
  const cached = getCached<{ items: Transaction[]; total: number; page: number }>(cacheKey);
  if (cached) return cached;

  const res = await fetch(`${API_BASE_URL}/transactions?${searchParams.toString()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch transactions from database`);
  const data = await res.json();
  setCached(cacheKey, data);
  return data;
}

export async function clearTransactions(): Promise<{ success: boolean; message: string }> {
  const email = localStorage.getItem('recoverai_user_email') || 'demo';
  const res = await fetch(`${API_BASE_URL}/transactions/clear?user_email=${encodeURIComponent(email)}`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to clear transactions`);
  const data = await res.json();
  triggerGlobalDataRefresh();
  return data;
}

export async function fetchRecoveryQueue(priority?: string): Promise<Transaction[]> {
  const searchParams = new URLSearchParams();
  if (priority && priority !== 'All') {
    searchParams.append('priority', priority);
  }
  const email = localStorage.getItem('recoverai_user_email');
  if (email) {
    searchParams.append('user_email', email);
  }
  const cacheKey = `queue_${searchParams.toString()}`;
  const cached = getCached<Transaction[]>(cacheKey);
  if (cached) return cached;

  const res = await fetch(`${API_BASE_URL}/transactions/queue?${searchParams.toString()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch recovery queue from database`);
  const data = await res.json();
  setCached(cacheKey, data);
  return data;
}

export async function executeRecoveryAction(transaction_id: string, action_type: string, notes?: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/actions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transaction_id, action_type, notes })
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to execute recovery action`);
  const data = await res.json();
  triggerGlobalDataRefresh();
  return data;
}

export async function ingestTransaction(payload: {
  transaction_id: string;
  customer_email: string;
  customer_name?: string;
  amount: number;
  payment_method: string;
  bank_name: string;
  failure_reason: string;
  status?: string;
  transaction_timestamp?: string;
}): Promise<{ success: boolean; message: string; transaction_id: string; ml_prediction?: any }> {
  const p = getUserEmailParam();
  const res = await fetch(`${API_BASE_URL}/ingest/transaction?${p}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to ingest transaction`);
  const data = await res.json();
  triggerGlobalDataRefresh();
  return data;
}

export async function uploadFile(file: File): Promise<{ success: boolean; message: string; count: number }> {
  const formData = new FormData();
  formData.append('file', file);
  const p = getUserEmailParam();
  const res = await fetch(`${API_BASE_URL}/ingest/upload-file?${p}`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to upload and parse file`);
  const data = await res.json();
  triggerGlobalDataRefresh();
  return data;
}

export async function predictRecovery(req: PredictRequest): Promise<PredictResponse> {
  const res = await fetch(`${API_BASE_URL}/predict-recovery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to execute ML recovery prediction`);
  return await res.json();
}

export async function fetchMLMetrics(): Promise<MLMetricsResponse> {
  const res = await fetch(`${API_BASE_URL}/predict/metrics`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch ML model metrics`);
  return await res.json();
}

export async function queryAIInsights(question: string, date_range: string = "30d"): Promise<InsightQueryResponse> {
  const res = await fetch(`${API_BASE_URL}/insights/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, date_range })
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to query RecoverAI AI Analyst`);
  return await res.json();
}

export async function fetchSettings(): Promise<{
  auto_retry_enabled: boolean;
  minimum_recovery_probability: number;
  maximum_retry_attempts: number;
  retry_delay_minutes: number;
  email_recovery_enabled: boolean;
}> {
  const p = getUserEmailParam();
  const res = await fetch(`${API_BASE_URL}/settings?${p}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch merchant settings`);
  return await res.json();
}

export async function updateSettings(settings: {
  auto_retry_enabled: boolean;
  minimum_recovery_probability: number;
  maximum_retry_attempts: number;
  retry_delay_minutes: number;
  email_recovery_enabled: boolean;
}): Promise<{ success: boolean; message: string }> {
  const p = getUserEmailParam();
  const res = await fetch(`${API_BASE_URL}/settings?${p}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to save merchant settings`);
  return await res.json();
}

export async function deleteTransaction(id: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/transactions/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to delete transaction`);
  const data = await res.json();
  triggerGlobalDataRefresh();
  return data;
}

export async function sendOTPEmail(email: string, name: string, otp_code: string): Promise<{ success: boolean }> {
  try {
    const res = await fetch(`${API_BASE_URL}/actions/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, otp_code })
    });
    if (!res.ok) return { success: false };
    return await res.json();
  } catch (e) {
    return { success: false };
  }
}

export async function registerMerchantProfile(email: string, full_name: string): Promise<{ success: boolean }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(`${API_BASE_URL}/settings/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, full_name }),
      signal: controller.signal
    });
    clearTimeout(timer);
    if (!res.ok) return { success: false };
    return await res.json();
  } catch (e) {
    return { success: false };
  }
}

export async function sendWelcomeEmail(email: string, name: string): Promise<{ success: boolean }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const targetUrl = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')
      ? '/api/send-welcome'
      : `${API_BASE_URL}/actions/send-welcome`;

    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name }),
      signal: controller.signal
    });
    clearTimeout(timer);
    if (!res.ok) return { success: false };
    return await res.json();
  } catch (e) {
    return { success: false };
  }
}

export async function sendResetCodeEmail(email: string, reset_code: string): Promise<{ success: boolean }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const targetUrl = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')
      ? '/api/send-reset'
      : `${API_BASE_URL}/actions/send-reset`;

    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, reset_code }),
      signal: controller.signal
    });
    clearTimeout(timer);
    if (!res.ok) return { success: false };
    return await res.json();
  } catch (e) {
    return { success: false };
  }
}
