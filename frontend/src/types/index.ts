export type PaymentMethod = 'UPI' | 'Credit Card' | 'Debit Card' | 'Net Banking' | 'Wallet';
export type BankName = 'HDFC Bank' | 'ICICI Bank' | 'State Bank of India' | 'Axis Bank' | 'Yes Bank' | 'Kotak Mahindra Bank';
export type FailureReason = 'Insufficient Funds' | 'Bank Decline' | 'Network Error' | 'Timeout' | 'Authentication Failure' | 'User Abandonment';
export type TransactionStatus = 'Failed' | 'Recovered' | 'Pending Retry' | 'Abandoned';
export type PriorityLevel = 'High' | 'Medium' | 'Low';

export interface Customer {
  id: string;
  name: string;
  email: string;
  segment?: 'Enterprise' | 'SMB' | 'Premium Retail';
  customer_segment?: string;
  total_transactions: number;
  successful_transactions: number;
  failed_transactions: number;
  success_rate: number;
  customer_lifetime_value?: number;
}

export interface Transaction {
  transaction_id: string;
  customer_id: string;
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  bank: BankName;
  status: TransactionStatus;
  failure_reason: FailureReason;
  transaction_timestamp: string;
  transaction_hour?: number;
  recovery_probability: number;
  priority_score: number;
  priority_level: PriorityLevel;
  recommended_action: string;
  ai_explanation?: string;
  last_action_taken?: string;
  last_action_timestamp?: string;
  customer?: Customer;
}

export interface KPISummary {
  revenue_at_risk: number;
  revenue_at_risk_change: number;
  potential_recovery: number;
  potential_recovery_change: number;
  failed_transactions_count: number;
  failed_transactions_change: number;
  recovery_opportunity_rate: number;
  recovery_opportunity_change: number;
}

export interface RevenueLossTrendPoint {
  date: string;
  revenue_lost: number;
  potential_recovered: number;
  failed_count: number;
}

export interface FailureReasonPoint {
  reason: FailureReason;
  count: number;
  amount: number;
  percentage: number;
}

export interface PaymentMethodPerformancePoint {
  method: PaymentMethod;
  total_transactions: number;
  failed_transactions: number;
  failure_rate: number;
  success_rate: number;
  volume: number;
}

export interface BankPerformancePoint {
  bank: BankName;
  total_transactions: number;
  failed_transactions: number;
  failure_rate: number;
  volume_lost: number;
}

export interface HourlyPatternPoint {
  hour: string;
  count: number;
  upi_count: number;
  volume: number;
}

export interface BusinessInsight {
  id: number;
  title: string;
  insight_text: string;
  impact_amount?: number;
  category: string;
  action_text: string;
}

export interface PredictRequest {
  transaction_amount: number;
  payment_method: string;
  failure_reason: string;
  transaction_hour: number;
  customer_success_rate: number;
  previous_failures: number;
  bank?: string;
}

export interface PredictResponse {
  recovery_probability: number;
  priority_score: number;
  priority_level: PriorityLevel;
  recommended_action: string;
  explanation: string;
}

export interface KeyFindingItem {
  title: string;
  description: string;
}

export interface MetricItem {
  label: string;
  value: string;
}

export interface ActionItem {
  action: string;
  impact: string;
  priority: string;
  target_page: string;
}

export interface InsightQueryResponse {
  intent: string;
  answer: string;
  key_findings: KeyFindingItem[];
  supporting_metrics: MetricItem[];
  recommended_actions: ActionItem[];
  source: string;
}

export interface MLMetricsResponse {
  is_trained: boolean;
  model_type: string;
  eval_methodology: string;
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    roc_auc: number;
    train_samples: number;
    test_samples: number;
  };
  feature_importances: Record<string, number>;
}
