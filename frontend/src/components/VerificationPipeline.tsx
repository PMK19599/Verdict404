import React from 'react';
import {
  VerificationState,
  PaymentSimulationInfo,
  VerdictResultType,
} from '../types/verdict';
import {
  Send,
  CreditCard,
  CheckCircle2,
  Cpu,
  ShieldCheck,
  Loader2,
  Clock,
} from 'lucide-react';

interface VerificationPipelineProps {
  state: VerificationState;
  statusMessage?: string;
  paymentInfo: PaymentSimulationInfo | null;
  finalVerdict?: VerdictResultType | null;
}

interface StepDef {
  id: string;
  title: string;
  subtitle: string;
  statesTriggered: VerificationState[];
  icon: any;
}

const STEPS: StepDef[] = [
  {
    id: 'step-req',
    title: '1. Request',
    subtitle: 'POST /verify',
    statesTriggered: ['REQUESTING', 'PAYMENT_REQUIRED', 'PAYING', 'PAYMENT_SETTLED', 'VERIFYING', 'PASS', 'FAIL', 'ERROR'],
    icon: Send,
  },
  {
    id: 'step-402',
    title: '2. 402 Required',
    subtitle: 'x402 Protocol Challenge',
    statesTriggered: ['PAYMENT_REQUIRED', 'PAYING', 'PAYMENT_SETTLED', 'VERIFYING', 'PASS', 'FAIL', 'ERROR'],
    icon: CreditCard,
  },
  {
    id: 'step-pay',
    title: '3. x402 Micropay',
    subtitle: '0.01 USDC on Algorand',
    statesTriggered: ['PAYING', 'PAYMENT_SETTLED', 'VERIFYING', 'PASS', 'FAIL', 'ERROR'],
    icon: CreditCard,
  },
  {
    id: 'step-settle',
    title: '4. Settle ✓',
    subtitle: 'On-chain Confirmation',
    statesTriggered: ['PAYMENT_SETTLED', 'VERIFYING', 'PASS', 'FAIL', 'ERROR'],
    icon: CheckCircle2,
  },
  {
    id: 'step-verify',
    title: '5. Verify Engine',
    subtitle: 'AST & Invariant Analysis',
    statesTriggered: ['VERIFYING', 'PASS', 'FAIL', 'ERROR'],
    icon: Cpu,
  },
  {
    id: 'step-verdict',
    title: '6. Verdict',
    subtitle: 'Independent Result',
    statesTriggered: ['PASS', 'FAIL', 'ERROR'],
    icon: ShieldCheck,
  },
];

export const VerificationPipeline: React.FC<VerificationPipelineProps> = ({
  state,
  statusMessage,
  paymentInfo,
  finalVerdict,
}) => {
  const isTerminal = state === 'PASS' || state === 'FAIL' || state === 'ERROR';
  const isRunning =
    state === 'REQUESTING' ||
    state === 'PAYMENT_REQUIRED' ||
    state === 'PAYING' ||
    state === 'PAYMENT_SETTLED' ||
    state === 'VERIFYING';

  // Helper to determine step status
  const getStepStatus = (index: number) => {
    if (state === 'IDLE') return 'idle';

    const order: VerificationState[] = [
      'IDLE',
      'REQUESTING',
      'PAYMENT_REQUIRED',
      'PAYING',
      'PAYMENT_SETTLED',
      'VERIFYING',
      'PASS', // or FAIL or ERROR
    ];

    let currentOrderIdx = order.indexOf(state);
    if (state === 'FAIL' || state === 'ERROR') currentOrderIdx = 6;

    const stepOrderIdx = index + 1; // 1-indexed to match steps

    if (currentOrderIdx > stepOrderIdx) return 'completed';
    if (currentOrderIdx === stepOrderIdx) {
      if (isTerminal) return 'completed';
      return 'active';
    }
    return 'idle';
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl backdrop-blur-md space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-cyan-950 text-cyan-400 border border-cyan-800">
            <ShieldCheck className="h-3.5 w-3.5" />
          </div>
          <h3 className="font-mono text-xs uppercase tracking-wider font-semibold text-slate-300">
            x402 Verification Pipeline State
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-slate-400">Current State:</span>
          <span
            className={`rounded-md px-2 py-0.5 font-mono text-[11px] font-bold uppercase ${
              state === 'IDLE'
                ? 'bg-slate-800 text-slate-400'
                : state === 'PASS'
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                : state === 'FAIL'
                ? 'bg-rose-950 text-rose-400 border border-rose-800'
                : state === 'ERROR'
                ? 'bg-amber-950 text-amber-400 border border-amber-800'
                : 'bg-cyan-950 text-cyan-300 border border-cyan-800 animate-pulse'
            }`}
          >
            {state}
          </span>
        </div>
      </div>

      {/* Visual Stepper */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {STEPS.map((step, idx) => {
          const stepStatus = getStepStatus(idx);
          const Icon = step.icon;

          let cardStyle = 'border-slate-800 bg-slate-950/40 text-slate-500';
          let iconContainer = 'bg-slate-900 text-slate-600';

          if (stepStatus === 'completed') {
            if (idx === 5) {
              // Final verdict step
              if (finalVerdict === 'PASS') {
                cardStyle = 'border-emerald-500/50 bg-emerald-950/30 text-emerald-300';
                iconContainer = 'bg-emerald-500/20 text-emerald-400';
              } else if (finalVerdict === 'FAIL') {
                cardStyle = 'border-rose-500/50 bg-rose-950/30 text-rose-300';
                iconContainer = 'bg-rose-500/20 text-rose-400';
              } else {
                cardStyle = 'border-amber-500/50 bg-amber-950/30 text-amber-300';
                iconContainer = 'bg-amber-500/20 text-amber-400';
              }
            } else {
              cardStyle = 'border-cyan-500/40 bg-cyan-950/20 text-cyan-200';
              iconContainer = 'bg-cyan-500/20 text-cyan-400';
            }
          } else if (stepStatus === 'active') {
            cardStyle =
              'border-cyan-400 bg-cyan-950/40 text-white shadow-md shadow-cyan-500/20 ring-1 ring-cyan-400';
            iconContainer = 'bg-cyan-400 text-slate-950 animate-spin-slow';
          }

          return (
            <div
              key={step.id}
              className={`flex flex-col justify-between rounded-xl border p-3 transition-all ${cardStyle}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-1.5 rounded-lg ${iconContainer}`}>
                  {stepStatus === 'active' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                <span className="font-mono text-[10px] uppercase font-bold text-slate-400">
                  {stepStatus === 'completed' ? '✓ DONE' : stepStatus === 'active' ? '● RUN' : 'WAIT'}
                </span>
              </div>

              <div>
                <div className="font-mono text-xs font-semibold">{step.title}</div>
                <div className="text-[10px] text-slate-400 truncate">{step.subtitle}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Progression Message Bar */}
      {statusMessage && (
        <div className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 font-mono text-xs text-slate-300">
          {isRunning ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-cyan-400" />
          ) : isTerminal ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          ) : (
            <Clock className="h-4 w-4 shrink-0 text-slate-400" />
          )}
          <span className="flex-1">{statusMessage}</span>
        </div>
      )}

      {/* Payment / Algorand Transaction Info Pill */}
      {paymentInfo && paymentInfo.status === 'SETTLED' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-indigo-500/30 bg-indigo-950/20 px-3.5 py-2 font-mono text-xs text-indigo-300">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            <span>
              Settlement: <strong className="text-white">0.01 USDC</strong> on Algorand TestNet
            </span>
          </div>
          {paymentInfo.txHash && (
            <div className="flex items-center gap-1.5 text-[11px] text-indigo-400">
              <span className="text-slate-400">Tx:</span>
              <span className="font-mono truncate max-w-[160px] sm:max-w-[200px]" title={paymentInfo.txHash}>
                {paymentInfo.txHash}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
