import {
  GatewayHealth,
  PaymentSimulationInfo,
  VerificationState,
  VerifyRequest,
  VerifyResponse,
} from '../types/verdict';
import { executeMockVerification } from './mockVerifier';

// Default gateway URL per API contract (docs/API.md: "Local gateway: http://127.0.0.1:3000")
export const DEFAULT_GATEWAY_URL =
  (import.meta as any).env?.VITE_GATEWAY_URL || 'http://127.0.0.1:3000';

export interface VerificationProgressCallback {
  onStateChange: (state: VerificationState, message?: string) => void;
  onPaymentInfo?: (info: PaymentSimulationInfo) => void;
}

/**
 * Service Layer for Verdict404
 * Designed for clean substitution between Mock API mode and live x402 Gateway.
 */
class VerificationService {
  private gatewayUrl: string = DEFAULT_GATEWAY_URL;
  private isMockMode: boolean = true;

  constructor() {
    // Check if real gateway URL is provided in env
    if ((import.meta as any).env?.VITE_USE_MOCK === 'false') {
      this.isMockMode = false;
    }
  }

  public setGatewayUrl(url: string) {
    this.gatewayUrl = url;
  }

  public getGatewayUrl(): string {
    return this.gatewayUrl;
  }

  public setMockMode(enabled: boolean) {
    this.isMockMode = enabled;
  }

  public isUsingMock(): boolean {
    return this.isMockMode;
  }

  /**
   * Fetch Gateway Health (GET /)
   * Matches docs/API.md contract:
   * {
   *   "service": "Verdict404 x402 Gateway",
   *   "status": "running",
   *   "version": "0.2",
   *   "payment": "x402 enabled",
   *   "network": "Algorand TestNet",
   *   "verification_endpoint": "/verify"
   * }
   */
  public async getGatewayHealth(): Promise<GatewayHealth> {
    if (this.isMockMode) {
      // Return authoritative mock response matching API contract
      return {
        service: 'Verdict404 x402 Gateway',
        status: 'running',
        version: '0.2',
        payment: 'x402 enabled',
        network: 'Algorand TestNet',
        verification_endpoint: '/verify',
      };
    }

    try {
      const response = await fetch(`${this.gatewayUrl}/`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      if (!response.ok) {
        throw new Error(`Gateway returned HTTP ${response.status}`);
      }
      return await response.json();
    } catch (err: any) {
      throw new Error(`Failed to reach gateway at ${this.gatewayUrl}: ${err?.message || err}`);
    }
  }

  /**
   * Run verification through the 9-stage verification state machine.
   *
   * @param request The standard VerifyRequest ({ task, language, code })
   * @param callbacks Hook to observe the state transitions
   */
  public async verify(
    request: VerifyRequest,
    callbacks: VerificationProgressCallback
  ): Promise<VerifyResponse> {
    if (this.isMockMode) {
      return this.runMockVerificationFlow(request, callbacks);
    } else {
      return this.runRealGatewayVerification(request, callbacks);
    }
  }

  /**
   * Mock verification flow simulating the exact x402 payment & verification pipeline.
   */
  private async runMockVerificationFlow(
    request: VerifyRequest,
    callbacks: VerificationProgressCallback
  ): Promise<VerifyResponse> {
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    // 1. REQUESTING: Initial submission to /verify
    callbacks.onStateChange('REQUESTING', 'Submitting code to Verdict404 verification endpoint...');
    await sleep(400);

    // 2. PAYMENT_REQUIRED: Gateway responds with HTTP 402 Payment Required
    callbacks.onStateChange(
      'PAYMENT_REQUIRED',
      'HTTP 402: Payment Required. 0.01 USDC verification fee required.'
    );
    if (callbacks.onPaymentInfo) {
      callbacks.onPaymentInfo({
        amount: '0.01',
        asset: 'USDC (aUSDC)',
        network: 'Algorand TestNet',
        protocol: 'x402 Micropayment Protocol',
        status: 'REQUIRED',
      });
    }
    await sleep(550);

    // 3. PAYING: Autonomous facilitator / client payment initiated
    callbacks.onStateChange('PAYING', 'Broadcasting 0.01 USDC micropayment via x402 on Algorand...');
    if (callbacks.onPaymentInfo) {
      callbacks.onPaymentInfo({
        amount: '0.01',
        asset: 'USDC (aUSDC)',
        network: 'Algorand TestNet',
        protocol: 'x402 Micropayment Protocol',
        status: 'SETTLING',
      });
    }
    await sleep(700);

    // Generate mock Algorand transaction hash
    const randomTx = Array.from({ length: 52 }, () =>
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'.charAt(Math.floor(Math.random() * 32))
    ).join('');

    // 4. PAYMENT_SETTLED: Micropayment settled on-chain
    callbacks.onStateChange('PAYMENT_SETTLED', 'Payment Settled on Algorand TestNet.');
    if (callbacks.onPaymentInfo) {
      callbacks.onPaymentInfo({
        amount: '0.01',
        asset: 'USDC (aUSDC)',
        network: 'Algorand TestNet',
        protocol: 'x402 Micropayment Protocol',
        status: 'SETTLED',
        txHash: randomTx,
        settledAt: new Date().toLocaleTimeString(),
      });
    }
    await sleep(450);

    // 5. VERIFYING: Verification engine running safety checks
    callbacks.onStateChange('VERIFYING', 'Running independent invariant checks & AST analysis...');
    await sleep(650);

    // 6. RESULT: Compute result
    const result = executeMockVerification(request);

    // Update final state to PASS, FAIL, or ERROR
    callbacks.onStateChange(result.verdict, `Verification completed with verdict: ${result.verdict}`);
    return result;
  }

  /**
   * Real gateway verification call (POST /verify).
   * Note: The gateway handles the 402 challenge and x402 payment settlement.
   * Signing credentials are NEVER held in the browser.
   */
  private async runRealGatewayVerification(
    request: VerifyRequest,
    callbacks: VerificationProgressCallback
  ): Promise<VerifyResponse> {
    callbacks.onStateChange('REQUESTING', `Connecting to gateway at ${this.gatewayUrl}/verify...`);

    try {
      callbacks.onStateChange('PAYMENT_REQUIRED', 'Gateway returned HTTP 402. Resolving x402...');
      callbacks.onStateChange('PAYING', 'Processing x402 micropayment with gateway facilitator...');

      const response = await fetch(`${this.gatewayUrl}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (response.status === 402) {
        callbacks.onStateChange(
          'PAYMENT_REQUIRED',
          'HTTP 402 Payment Required: Please ensure gateway facilitator is configured.'
        );
        throw new Error('HTTP 402: Payment required by gateway.');
      }

      callbacks.onStateChange('PAYMENT_SETTLED', 'Gateway payment settled. Executing verification...');
      callbacks.onStateChange('VERIFYING', 'Verification engine evaluating response...');

      if (!response.ok) {
        const errorText = await response.text();
        callbacks.onStateChange('ERROR', `Gateway error: HTTP ${response.status}`);
        return {
          service: 'Verdict404',
          task: request.task,
          language: request.language,
          verdict: 'ERROR',
          tests_passed: 0,
          tests_failed: 0,
          confidence: 0,
          evidence: [`Gateway returned error ${response.status}: ${errorText}`],
          error: errorText,
        };
      }

      const data: VerifyResponse = await response.json();
      callbacks.onStateChange(data.verdict, `Verdict received: ${data.verdict}`);
      return data;
    } catch (err: any) {
      callbacks.onStateChange('ERROR', `Network/Gateway error: ${err?.message || err}`);
      return {
        service: 'Verdict404',
        task: request.task,
        language: request.language,
        verdict: 'ERROR',
        tests_passed: 0,
        tests_failed: 0,
        confidence: 0,
        evidence: [`Gateway Connection Error: ${err?.message || err}`],
        error: err?.message || 'Connection error',
      };
    }
  }
}

export const verificationService = new VerificationService();
