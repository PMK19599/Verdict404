import React from 'react';
import {
  VerificationState,
  PaymentSimulationInfo,
  VerdictResultType,
} from '../types/verdict';
import { Loader2, Clock } from 'lucide-react';

interface VerificationPipelineProps {
  state: VerificationState;
  statusMessage?: string;
  paymentInfo: PaymentSimulationInfo | null;
  finalVerdict?: VerdictResultType | null;
}

interface StepDef {
  id: string;
  label: string;
  sublabel: string;
  statesTriggered: VerificationState[];
}

const STEPS: StepDef[] = [
  {
    id: 'step-req',
    label: 'REQUEST',
    sublabel: 'POST /verify',
    statesTriggered: ['REQUESTING', 'PAYMENT_REQUIRED', 'PAYING', 'PAYMENT_SETTLED', 'VERIFYING', 'PASS', 'FAIL', 'ERROR'],
  },
  {
    id: 'step-402',
    label: 'PAYMENT',
    sublabel: 'x402 Protocol Challenge',
    statesTriggered: ['PAYMENT_REQUIRED', 'PAYING', 'PAYMENT_SETTLED', 'VERIFYING', 'PASS', 'FAIL', 'ERROR'],
  },
  {
    id: 'step-settle',
    label: 'SETTLEMENT',
    sublabel: '0.01 USDC · Algorand',
    statesTriggered: ['PAYING', 'PAYMENT_SETTLED', 'VERIFYING', 'PASS', 'FAIL', 'ERROR'],
  },
  {
    id: 'step-verify',
    label: 'VERIFICATION',
    sublabel: 'AST & Invariant Analysis',
    statesTriggered: ['VERIFYING', 'PASS', 'FAIL', 'ERROR'],
  },
  {
    id: 'step-verdict',
    label: 'VERDICT',
    sublabel: 'Independent Result',
    statesTriggered: ['PASS', 'FAIL', 'ERROR'],
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

  // Existing step status logic — untouched
  const getStepStatus = (index: number) => {
    if (state === 'IDLE') return 'idle';

    const order: VerificationState[] = [
      'IDLE',
      'REQUESTING',
      'PAYMENT_REQUIRED',
      'PAYING',
      'PAYMENT_SETTLED',
      'VERIFYING',
      'PASS',
    ];

    let currentOrderIdx = order.indexOf(state);
    if (state === 'FAIL' || state === 'ERROR') currentOrderIdx = 6;

    const stepOrderIdx = index + 1;

    if (currentOrderIdx > stepOrderIdx) return 'completed';
    if (currentOrderIdx === stepOrderIdx) {
      if (isTerminal) return 'completed';
      return 'active';
    }
    return 'idle';
  };

  // Verdict step status for final step
  const getVerdictStepStatus = () => {
    if (isTerminal) return 'verdict';
    const stepStatus = getStepStatus(4);
    return stepStatus;
  };

  return (
    <div className="border border-slate-800 rounded bg-slate-950/80 p-4 space-y-3">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <p className="console-label">Verification Pipeline</p>
        <span
          className={`font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
            state === 'IDLE'
              ? 'border-slate-800 text-slate-600 bg-slate-900'
              : state === 'PASS'
              ? 'border-emerald-800 text-emerald-400 bg-emerald-950/50'
              : state === 'FAIL'
              ? 'border-red-800 text-red-400 bg-red-950/50'
              : state === 'ERROR'
              ? 'border-amber-800 text-amber-400 bg-amber-950/50'
              : 'border-cyan-800 text-cyan-400 bg-cyan-950/50 animate-pulse-subtle'
          }`}
        >
          {state}
        </span>
      </div>

      {/* Vertical step list */}
      <div className="flex flex-col">
        {STEPS.map((step, idx) => {
          const isLastStep = idx === STEPS.length - 1;
          const stepStatus = isLastStep ? getVerdictStepStatus() : getStepStatus(idx);

          // Determine rendering
          let dotClass = 'step-dot-idle';
          let labelClass = 'text-slate-600';
          let sublabelClass = 'text-slate-700';
          let badge: React.ReactNode = null;
          let symbol = '○';
          let connectorClass = 'step-connector';

          if (stepStatus === 'completed') {
            dotClass = 'step-dot-done';
            labelClass = 'text-slate-300';
            sublabelClass = 'text-slate-500';
            symbol = '✓';
            connectorClass = 'step-connector-done';
          } else if (stepStatus === 'active') {
            dotClass = 'step-dot-active';
            labelClass = 'text-white font-semibold';
            sublabelClass = 'text-slate-400';
            symbol = '◉';
            badge = (
              <span className="ml-2 font-mono text-[9px] uppercase text-cyan-500 border border-cyan-900 px-1 py-0.5 rounded">
                running
              </span>
            );
          } else if (stepStatus === 'verdict') {
            // Final verdict step with colour
            if (finalVerdict === 'PASS') {
              dotClass = 'step-dot-pass';
              labelClass = 'text-green-400 font-bold';
              sublabelClass = 'text-green-600';
              symbol = '✓';
              connectorClass = 'step-connector-done';
            } else if (finalVerdict === 'FAIL') {
              dotClass = 'step-dot-fail';
              labelClass = 'text-red-400 font-bold';
              sublabelClass = 'text-red-600';
              symbol = '✗';
              connectorClass = 'step-connector-done';
            } else if (finalVerdict === 'ERROR') {
              dotClass = 'step-dot-error';
              labelClass = 'text-amber-400 font-bold';
              sublabelClass = 'text-amber-600';
              symbol = '⚠';
              connectorClass = 'step-connector-done';
            } else {
              // terminal but no verdict yet — treat as completed
              dotClass = 'step-dot-done';
              labelClass = 'text-slate-300';
              sublabelClass = 'text-slate-500';
              symbol = '✓';
              connectorClass = 'step-connector-done';
            }
          }

          return (
            <div key={step.id} className="flex gap-3">
              {/* Left: dot + connector */}
              <div className="flex flex-col items-center" style={{ width: 10 }}>
                <div className={dotClass} aria-hidden="true" />
                {!isLastStep && (
                  <div className={connectorClass} />
                )}
              </div>

              {/* Right: label */}
              <div className={`pb-${isLastStep ? '0' : '3'} min-w-0 flex-1`} style={{ paddingBottom: isLastStep ? 0 : 12 }}>
                <div className="flex items-center gap-1">
                  <span className={`font-mono text-xs ${labelClass}`}>
                    <span className="text-[10px] mr-1 opacity-50 select-none">{symbol}</span>
                    {step.label}
                  </span>
                  {badge}
                  {stepStatus === 'active' && (
                    <Loader2 className="h-3 w-3 text-cyan-500 animate-spin ml-1" />
                  )}
                </div>
                <div className={`font-mono text-[10px] ${sublabelClass}`}>
                  {step.sublabel}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Status message bar */}
      {statusMessage && (
        <div className="flex items-center gap-2 border-t border-slate-800 pt-3 font-mono text-[11px] text-slate-400">
          {isRunning ? (
            <Loader2 className="h-3 w-3 shrink-0 animate-spin text-cyan-500" />
          ) : (
            <Clock className="h-3 w-3 shrink-0 text-slate-600" />
          )}
          <span className="flex-1 truncate">{statusMessage}</span>
        </div>
      )}

      {/* Payment info */}
      {paymentInfo && paymentInfo.status === 'SETTLED' && (
        <div className="flex flex-col gap-1 border-t border-slate-800 pt-3 font-mono text-[11px]">
          <div className="flex items-center gap-2 text-indigo-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0"></span>
            <span>
              Settled: <strong className="text-white">0.01 USDC</strong> · Algorand TestNet
            </span>
          </div>
          {paymentInfo.txHash && (
            <div className="text-slate-600 flex items-center gap-1.5 pl-3.5">
              <span>Tx:</span>
              <span
                className="text-slate-500 truncate max-w-[180px]"
                title={paymentInfo.txHash}
              >
                {paymentInfo.txHash}
              </span>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
