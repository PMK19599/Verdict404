/**
 * Authoritative Verdict404 Types based on docs/API.md contract
 */

export type TaskType = 'safe_divide' | 'validate_json';
export type LanguageType = 'python' | 'json';

export type VerificationState =
  | 'IDLE'
  | 'REQUESTING'
  | 'PAYMENT_REQUIRED'
  | 'PAYING'
  | 'PAYMENT_SETTLED'
  | 'VERIFYING'
  | 'PASS'
  | 'FAIL'
  | 'ERROR';

export type VerdictResultType = 'PASS' | 'FAIL' | 'ERROR';

export interface VerifyRequest {
  task: TaskType | string;
  language: LanguageType | string;
  code: string;
}

export interface VerifyResponse {
  service: string;
  task: string;
  language: string;
  verdict: VerdictResultType;
  tests_passed: number;
  tests_failed: number;
  confidence: number;
  evidence: string[];
  error?: string;
}

export interface GatewayHealth {
  service: string;
  status: string;
  version: string;
  payment: string;
  network: string;
  verification_endpoint: string;
}

export interface PaymentSimulationInfo {
  amount: string;
  asset: string;
  network: string;
  protocol: string;
  status: 'PENDING' | 'REQUIRED' | 'SETTLING' | 'SETTLED';
  txHash?: string;
  settledAt?: string;
}

export interface PresetItem {
  id: string;
  title: string;
  description: string;
  expectedVerdict: VerdictResultType;
  code: string;
}
