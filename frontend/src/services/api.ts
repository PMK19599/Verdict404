import {
  GatewayHealth,
  PaymentSimulationInfo,
  VerificationState,
  VerifyRequest,
  VerifyResponse,
} from '../types/verdict';

import { executeMockVerification } from './mockVerifier';

import { x402Client } from '@x402/core/client';
import { ExactAvmScheme } from '@x402/avm/exact/client';
import type { ClientAvmSigner } from '@x402/avm';
import { wrapFetchWithPayment } from '@x402/fetch';


// ============================================================
// Gateway configuration
// ============================================================

export const DEFAULT_GATEWAY_URL =
  (import.meta as any).env?.VITE_GATEWAY_URL ||
  'http://127.0.0.1:3000';

export const DEFAULT_VERIFY_SERVICE_URL =
  (import.meta as any).env?.VITE_VERIFY_SERVICE_URL ||
  'http://127.0.0.1:8000';

const ALGORAND_TESTNET_CAIP2 =
  'algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=';


// ============================================================
// Progress callbacks
// ============================================================

export interface VerificationProgressCallback {
  onStateChange: (
    state: VerificationState,
    message?: string
  ) => void;

  onPaymentInfo?: (
    info: PaymentSimulationInfo
  ) => void;
}


// ============================================================
// Verification Service
// ============================================================

class VerificationService {
  private gatewayUrl: string =
    DEFAULT_GATEWAY_URL;

  private verifyServiceUrl: string =
    DEFAULT_VERIFY_SERVICE_URL;

  private isMockMode = true;

  /**
   * Connected Algorand wallet signer.
   *
   * Pera/Defly performs the actual signing.
   * No private key is stored in the frontend.
   */
  private avmSigner: ClientAvmSigner | null = null;


  constructor() {
    if (
      (import.meta as any).env?.VITE_USE_MOCK ===
      'false'
    ) {
      this.isMockMode = false;
    }
  }


  // ==========================================================
  // Gateway configuration
  // ==========================================================

  public setGatewayUrl(url: string) {
    this.gatewayUrl = url;
  }

  public getGatewayUrl(): string {
    return this.gatewayUrl;
  }

  public setVerifyServiceUrl(url: string) {
    this.verifyServiceUrl = url;
  }

  public getVerifyServiceUrl(): string {
    return this.verifyServiceUrl;
  }


  // ==========================================================
  // Mock mode
  // ==========================================================

  public setMockMode(enabled: boolean) {
    this.isMockMode = enabled;
  }

  public isUsingMock(): boolean {
    return this.isMockMode;
  }


  // ==========================================================
  // Wallet signer
  // ==========================================================

  public setAvmSigner(
    signer: ClientAvmSigner | null
  ) {
    this.avmSigner = signer;
  }

  public getAvmSigner():
    ClientAvmSigner | null {
    return this.avmSigner;
  }


  // ==========================================================
  // Gateway health
  // ==========================================================

  public async getGatewayHealth():
    Promise<GatewayHealth> {

    if (this.isMockMode) {
      return {
        service:
          'Verdict404 x402 Gateway',
        status: 'running',
        version: '0.3',
        payment: 'x402 enabled',
        network: 'Algorand TestNet',
        verification_endpoint: '/verify',
      };
    }

    try {
      const response = await fetch(
        `${this.gatewayUrl}/`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Gateway returned HTTP ${response.status}`
        );
      }

      return await response.json();

    } catch (err: any) {
      throw new Error(
        `Failed to reach gateway at ${this.gatewayUrl}: ${
          err?.message || err
        }`
      );
    }
  }


  // ==========================================================
  // Verification entry point
  // ==========================================================

  public async verify(
    request: VerifyRequest,
    callbacks: VerificationProgressCallback
  ): Promise<VerifyResponse> {

    if (this.isMockMode) {
      return this.runMockVerificationFlow(
        request,
        callbacks
      );
    }

    return this.runRealGatewayVerification(
      request,
      callbacks
    );
  }


  // ==========================================================
  // Mock verification
  // ==========================================================

  private async runMockVerificationFlow(
    request: VerifyRequest,
    callbacks: VerificationProgressCallback
  ): Promise<VerifyResponse> {

    const sleep = (ms: number) =>
      new Promise(resolve =>
        setTimeout(resolve, ms)
      );


    callbacks.onStateChange(
      'REQUESTING',
      'Submitting code to Verdict404 verification endpoint...'
    );

    await sleep(400);


    callbacks.onStateChange(
      'PAYMENT_REQUIRED',
      '[SIMULATION] HTTP 402: Payment Required. 0.01 USDC verification fee required.'
    );

    callbacks.onPaymentInfo?.({
      amount: '0.01',
      asset: 'USDC (Simulated)',
      network: 'Algorand TestNet',
      protocol:
        'x402 Micropayment Protocol (Simulated)',
      status: 'REQUIRED',
    });

    await sleep(550);


    callbacks.onStateChange(
      'PAYING',
      '[SIMULATION] Broadcasting 0.01 USDC micropayment via x402 on Algorand...'
    );

    callbacks.onPaymentInfo?.({
      amount: '0.01',
      asset: 'USDC (Simulated)',
      network: 'Algorand TestNet',
      protocol:
        'x402 Micropayment Protocol (Simulated)',
      status: 'SETTLING',
    });

    await sleep(700);


    const randomTx =
      Array.from(
        { length: 52 },
        () =>
          'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
            .charAt(
              Math.floor(
                Math.random() * 32
              )
            )
      ).join('');


    callbacks.onStateChange(
      'PAYMENT_SETTLED',
      '[SIMULATION] Payment Settled on Algorand TestNet.'
    );

    callbacks.onPaymentInfo?.({
      amount: '0.01',
      asset: 'USDC (Simulated)',
      network: 'Algorand TestNet',
      protocol:
        'x402 Micropayment Protocol (Simulated)',
      status: 'SETTLED',
      txHash:
        `SIMULATED_TX_${randomTx.substring(0, 16)}...`,
      settledAt:
        new Date().toLocaleTimeString(),
    });

    await sleep(450);


    callbacks.onStateChange(
      'VERIFYING',
      'Running independent invariant checks & AST analysis...'
    );

    await sleep(650);


    const result =
      executeMockVerification(request);

    callbacks.onStateChange(
      result.verdict,
      `Verification completed with verdict: ${result.verdict}`
    );

    return result;
  }


  // ==========================================================
  // Real x402 + Algorand verification
  // ==========================================================

  public async runRealGatewayVerification(
    request: VerifyRequest,
    callbacks: VerificationProgressCallback
  ): Promise<VerifyResponse> {

    callbacks.onStateChange(
      'REQUESTING',
      `Connecting to gateway at ${this.gatewayUrl}/verify...`
    );


    if (!this.avmSigner) {

      const message =
        'No Algorand wallet is connected. Connect Pera or Defly before paying.';

      callbacks.onStateChange(
        'ERROR',
        message
      );

      return {
        service: 'Verdict404',
        task: request.task,
        language: request.language,
        verdict: 'ERROR',
        tests_passed: 0,
        tests_failed: 0,
        confidence: 0,
        evidence: [message],
        error: message,
      };
    }


    try {

      // --------------------------------------------------------
      // Create x402 client
      // --------------------------------------------------------

      const client =
        new x402Client();


      // --------------------------------------------------------
      // Register Algorand Exact payment scheme
      // --------------------------------------------------------

      client.register(
        ALGORAND_TESTNET_CAIP2,
        new ExactAvmScheme(
          this.avmSigner
        )
      );


      // --------------------------------------------------------
      // Wrap fetch with x402 payment handling
      // --------------------------------------------------------

      const fetchWithPayment =
        wrapFetchWithPayment(
          fetch,
          client
        );


      callbacks.onStateChange(
        'PAYMENT_REQUIRED',
        'Ready for x402 payment. Preparing 0.01 USDC payment...'
      );

      callbacks.onPaymentInfo?.({
        amount: '0.01',
        asset: 'USDC',
        network: 'Algorand TestNet',
        protocol:
          'x402 Micropayment Protocol',
        status: 'REQUIRED',
      });


      callbacks.onStateChange(
        'PAYING',
        'Waiting for wallet approval and signing the Algorand payment...'
      );

      callbacks.onPaymentInfo?.({
        amount: '0.01',
        asset: 'USDC',
        network: 'Algorand TestNet',
        protocol:
          'x402 Micropayment Protocol',
        status: 'SETTLING',
      });


      // --------------------------------------------------------
      // x402 handles:
      //
      // 1. POST /verify
      // 2. Receive HTTP 402
      // 3. Read payment requirements
      // 4. Build Algorand USDC transaction
      // 5. Ask Pera / Defly to sign
      // 6. Attach X-PAYMENT
      // 7. Retry /verify
      // 8. Receive paid response
      // --------------------------------------------------------

      const response =
        await fetchWithPayment(
          `${this.gatewayUrl}/verify`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',

              Accept:
                'application/json',
            },

            body:
              JSON.stringify(request),
          }
        );


      // --------------------------------------------------------
      // Payment failed
      // --------------------------------------------------------

      if (response.status === 402) {

        const errorText =
          await response.text();

        callbacks.onStateChange(
          'ERROR',
          `HTTP 402 Payment Required: ${errorText}`
        );

        return {
          service: 'Verdict404',
          task: request.task,
          language: request.language,
          verdict: 'ERROR',
          tests_passed: 0,
          tests_failed: 0,
          confidence: 0,
          evidence: [
            'x402 payment could not be completed.',
            errorText,
          ],
          error:
            'HTTP 402: Payment required.',
        };
      }


      callbacks.onStateChange(
        'PAYMENT_SETTLED',
        'x402 payment settled. Executing verification...'
      );


      callbacks.onStateChange(
        'VERIFYING',
        'Verification engine evaluating submitted code...'
      );


      if (!response.ok) {

        const errorText =
          await response.text();

        callbacks.onStateChange(
          'ERROR',
          `Gateway error: HTTP ${response.status}`
        );

        return {
          service: 'Verdict404',
          task: request.task,
          language: request.language,
          verdict: 'ERROR',
          tests_passed: 0,
          tests_failed: 0,
          confidence: 0,
          evidence: [
            `Gateway returned error ${response.status}: ${errorText}`,
          ],
          error: errorText,
        };
      }


      const data:
        VerifyResponse =
        await response.json();


      callbacks.onStateChange(
        data.verdict,
        `Verdict received: ${data.verdict}`
      );

      callbacks.onPaymentInfo?.({
        amount: '0.01',
        asset: 'USDC',
        network: 'Algorand TestNet',
        protocol:
          'x402 Micropayment Protocol',
        status: 'SETTLED',
        settledAt:
          new Date().toLocaleTimeString(),
      });

      return data;


    } catch (err: any) {

      console.error(
        'Verdict404 x402 verification error:',
        err
      );

      const message =
        err?.message || String(err);

      callbacks.onStateChange(
        'ERROR',
        `Network/Gateway error: ${message}`
      );

      return {
        service: 'Verdict404',
        task: request.task,
        language: request.language,
        verdict: 'ERROR',
        tests_passed: 0,
        tests_failed: 0,
        confidence: 0,
        evidence: [
          `Gateway Connection Error: ${message}`,
        ],
        error: message,
      };
    }
  }
}


export const verificationService =
  new VerificationService();
