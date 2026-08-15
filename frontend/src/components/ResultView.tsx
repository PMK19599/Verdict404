import React, { useState } from 'react';
import {
  VerifyResponse,
  PaymentSimulationInfo,
} from '../types/verdict';
import {
  ShieldCheck,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Code,
  ListTree,
  Coins,
  Percent,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';

interface ResultViewProps {
  result: VerifyResponse;
  paymentInfo: PaymentSimulationInfo | null;
  onReset: () => void;
  onRetry: () => void;
}

export const ResultView: React.FC<ResultViewProps> = ({
  result,
  paymentInfo,
  onReset,
  onRetry,
}) => {
  const [activeTab, setActiveTab] = useState<'evidence' | 'json' | 'payment'>('evidence');
  const [copied, setCopied] = useState(false);

  const verdict = result.verdict;
  const isFail = verdict === 'FAIL';
  const isError = verdict === 'ERROR';

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Color theme classes based on verdict
  let borderTheme = 'border-emerald-500/40 bg-gradient-to-b from-emerald-950/30 via-slate-900 to-slate-950';
  let glowTheme = 'glow-pass';
  let badgeColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
  let VerdictIcon = ShieldCheck;
  let verdictTitle = 'Independent Verification: PASSED';
  let verdictSubtitle = 'All safety invariants and checks verified successfully.';

  if (isFail) {
    borderTheme = 'border-rose-500/40 bg-gradient-to-b from-rose-950/30 via-slate-900 to-slate-950';
    glowTheme = 'glow-fail';
    badgeColor = 'bg-rose-500/20 text-rose-400 border-rose-500/40';
    VerdictIcon = XCircle;
    verdictTitle = 'Independent Verification: FAILED';
    verdictSubtitle = 'One or more safety invariants were violated by the submitted code.';
  } else if (isError) {
    borderTheme = 'border-amber-500/40 bg-gradient-to-b from-amber-950/30 via-slate-900 to-slate-950';
    glowTheme = 'glow-error';
    badgeColor = 'bg-amber-500/20 text-amber-400 border-amber-500/40';
    VerdictIcon = AlertTriangle;
    verdictTitle = 'Independent Verification: ERROR';
    verdictSubtitle = 'Unable to evaluate invariants due to syntax or parse failure.';
  }

  return (
    <div className={`rounded-3xl border ${borderTheme} ${glowTheme} p-6 sm:p-7 shadow-2xl transition-all`}>
      {/* Header Banner with Verdict Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-2xl border ${badgeColor}`}>
            <VerdictIcon className="h-8 w-8" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className={`rounded-lg border px-3 py-0.5 font-mono text-base font-extrabold uppercase ${badgeColor}`}>
                {verdict}
              </span>
              <span className="font-mono text-xs text-slate-400">
                Task: <strong className="text-white">{result.task}</strong>
              </span>
              <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-slate-400 uppercase">
                {result.language}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white mt-1.5">{verdictTitle}</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">{verdictSubtitle}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-mono font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Re-verify</span>
          </button>
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-950/40 px-3.5 py-2 text-xs font-mono font-medium text-cyan-300 hover:bg-cyan-900/40 transition"
          >
            <span>New Verification</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <Percent className="h-3.5 w-3.5 text-cyan-400" />
            <span>Confidence</span>
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-white">
            {result.confidence}%
          </div>
        </div>

        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Checks Passed</span>
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-emerald-400">
            {result.tests_passed}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
            <span>Checks Failed</span>
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-rose-400">
            {result.tests_failed}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <Coins className="h-3.5 w-3.5 text-indigo-400" />
            <span>Fee Paid</span>
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-indigo-300">
            0.01 <span className="text-xs text-slate-400 font-normal">USDC</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('evidence')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-mono transition ${
              activeTab === 'evidence'
                ? 'bg-slate-800 text-cyan-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ListTree className="h-3.5 w-3.5" />
            <span>Evidence Trace ({result.evidence.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('json')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-mono transition ${
              activeTab === 'json'
                ? 'bg-slate-800 text-cyan-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="h-3.5 w-3.5" />
            <span>Raw Response JSON</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('payment')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-mono transition ${
              activeTab === 'payment'
                ? 'bg-slate-800 text-cyan-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Coins className="h-3.5 w-3.5" />
            <span>x402 Receipt</span>
          </button>
        </div>

        {activeTab === 'json' && (
          <button
            type="button"
            onClick={handleCopyJson}
            className="flex items-center gap-1 text-xs font-mono text-slate-400 hover:text-slate-200 transition"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy JSON</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'evidence' && (
        <div className="space-y-2.5">
          {result.evidence.map((item, idx) => {
            const isItemPass = item.startsWith('PASS:');
            const isItemFail = item.startsWith('FAIL:');

            return (
              <div
                key={idx}
                className={`flex items-start gap-3 rounded-xl border p-3.5 font-mono text-xs sm:text-sm transition ${
                  isItemPass
                    ? 'border-emerald-500/20 bg-emerald-950/20 text-emerald-200'
                    : isItemFail
                    ? 'border-rose-500/30 bg-rose-950/30 text-rose-200'
                    : 'border-amber-500/30 bg-amber-950/30 text-amber-200'
                }`}
              >
                {isItemPass ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                ) : isItemFail ? (
                  <XCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                )}
                <div className="flex-1 break-words">{item}</div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'json' && (
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-300 overflow-x-auto">
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}

      {activeTab === 'payment' && (
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 font-mono text-xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300">
            <div className="rounded-lg bg-slate-900/60 p-2.5 border border-slate-800">
              <span className="text-slate-500 text-[11px] block">Payment Protocol</span>
              <span className="text-white font-semibold">x402 Micropayment Protocol</span>
            </div>
            <div className="rounded-lg bg-slate-900/60 p-2.5 border border-slate-800">
              <span className="text-slate-500 text-[11px] block">Network</span>
              <span className="text-white font-semibold">Algorand TestNet</span>
            </div>
            <div className="rounded-lg bg-slate-900/60 p-2.5 border border-slate-800">
              <span className="text-slate-500 text-[11px] block">Asset & Amount</span>
              <span className="text-cyan-300 font-semibold">0.01 USDC (10,000 micro-USDC)</span>
            </div>
            <div className="rounded-lg bg-slate-900/60 p-2.5 border border-slate-800">
              <span className="text-slate-500 text-[11px] block">Settlement Time</span>
              <span className="text-white font-semibold">{paymentInfo?.settledAt || 'Instant (< 1s)'}</span>
            </div>
          </div>

          {paymentInfo?.txHash && (
            <div className="rounded-lg bg-slate-900/60 p-2.5 border border-slate-800">
              <span className="text-slate-500 text-[11px] block">Algorand Transaction ID</span>
              <span className="text-indigo-300 break-all select-all">{paymentInfo.txHash}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
