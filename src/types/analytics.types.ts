export interface TopMerchantResponse {
  merchant_id: string;
  total_volume: number;
}

export interface MonthlyActiveMerchantsResponse {
  [month: string]: number;
}

export interface ProductAdoptionResponse {
  [product: string]: number;
}

export interface KycFunnelResponse {
  documents_submitted: number;
  verifications_completed: number;
  tier_upgrades: number;
}

export interface FailureRateItem {
  product: string;
  failure_rate: number;
}

export type FailureRatesResponse = FailureRateItem[];