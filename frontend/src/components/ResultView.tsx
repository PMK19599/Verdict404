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

  // Theme per verdict
  let panelAccent = 'verdict-panel-pass';
  let verdictColor = 'text-green-400';
  let verdictBorder = 'border-green-800/50';
  let verdictBg = 'bg-green-950/20';
  let VerdictIcon = ShieldCheck;
  let verdictHeading = 'INDEPENDENT VERIFICATION — PASSED';
  let verdictSubtitle = 'All safety invariants and checks verified successfully.';

  if (isFail) {
    panelAccent = 'verdict-panel-fail';
    verdictColor = 'text-red-400';
    verdictBorder = 'border-red-800/50';
    verdictBg = 'bg-red-950/20';
    VerdictIcon = XCircle;
    verdictHeading = 'INDEPENDENT VERIFICATION — FAILED';
    verdictSubtitle = 'One or more safety invariants were violated by the submitted code.';
  } else if (isError) {
    panelAccent = 'verdict-panel-error';
    verdictColor = 'text-amber-400';
    verdictBorder = 'border-amber-800/50';
    verdictBg = 'bg-amber-950/20';
    VerdictIcon = AlertTriangle;
    verdictHeading = 'VERIFICATION COULD NOT BE COMPLETED';
    verdictSubtitle = 'Unable to evaluate invariants due to syntax or parse failure.';
  }

  return (
    <div className={`border border-slate-800 rounded bg-slate-950/60 ${panelAccent} overflow-hidden`}>

      {/* Verdict Banner */}
      <div className={`${verdictBg} border-b ${verdictBorder} px-5 py-4`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <VerdictIcon className={`h-5 w-5 mt-0.5 shrink-0 ${verdictColor}`} />
            <div>
              <p className="console-label mb-1">
                {result.task} · {result.language}
              </p>
              <h2 className={`font-mono text-base font-bold leading-tight ${verdictColor}`}>
                {verdictHeading}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-mono">{verdictSubtitle}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onRetry}
              title="Re-verify"
              className="flex items-center gap-1 rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 font-mono text-[11px] text-slate-400 hover:border-slate-700 hover:text-slate-200 transition"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Re-run</span>
            </button>
            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-1 rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 font-mono text-[11px] text-slate-400 hover:border-slate-700 hover:text-slate-200 transition"
            >
              <span>New</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics strip */}
      <div className="grid grid-cols-4 border-b border-slate-800 divide-x divide-slate-800">
        <div className="px-4 py-2.5">
          <p className="console-label mb-0.5">Confidence</p>
          <div className="font-mono text-sm font-bold text-white">{result.confidence}%</div>
        </div>
        <div className="px-4 py-2.5">
          <div className="flex items-center gap-1 console-label mb-0.5">
            <CheckCircle2 className="h-2.5 w-2.5 text-green-500" />
            Passed
          </div>
          <div className="font-mono text-sm font-bold text-green-400">{result.tests_passed}</div>
        </div>
        <div className="px-4 py-2.5">
          <div className="flex items-center gap-1 console-label mb-0.5">
            <AlertCircle className="h-2.5 w-2.5 text-red-500" />
            Failed
          </div>
          <div className="font-mono text-sm font-bold text-red-400">{result.tests_failed}</div>
        </div>
        <div className="px-4 py-2.5">
          <p className="console-label mb-0.5">Fee Paid</p>
          <div className="font-mono text-sm font-bold text-slate-300">
            0.01 <span className="text-[10px] text-slate-500 font-normal">USDC</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 px-4">
        <div className="flex items-center gap-0">
          {[
            { id: 'evidence' as const, label: `Evidence (${result.evidence.length})`, Icon: ListTree },
            { id: 'json' as const, label: 'Raw JSON', Icon: Code },
            { id: 'payment' as const, label: 'x402 Receipt', Icon: Coins },
          ].map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 font-mono text-[11px] border-b-2 transition ${
                activeTab === id
                  ? 'border-cyan-500 text-cyan-300'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'json' && (
          <button
            type="button"
            onClick={handleCopyJson}
            className="flex items-center gap-1 font-mono text-[11px] text-slate-500 hover:text-slate-300 transition"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-green-400" />
                <span className="text-green-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Tab content */}
      <div className="p-4">

        {activeTab === 'evidence' && (
          <div className="space-y-1">
            <p className="console-label mb-2">Verification Evidence</p>
            {result.evidence.map((item, idx) => {
              const isItemPass = item.startsWith('PASS:');
              const isItemFail = item.startsWith('FAIL:');
              // Strip prefix for cleaner display
              const displayText = item.replace(/^(PASS|FAIL|ERROR|WARN):\s*/i, '');

              return (
                <div
                  key={idx}
                  className={isItemPass ? 'evidence-item-pass' : isItemFail ? 'evidence-item-fail' : 'evidence-item-warn'}
                >
                  <span className="shrink-0 mt-0.5 select-none">
                    {isItemPass ? '✓' : isItemFail ? '✗' : '⚠'}
                  </span>
                  <span>{displayText}</span>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'json' && (
          <div className="rounded border border-slate-800 bg-slate-950 p-3 font-mono text-[11px] text-slate-300 overflow-x-auto">
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}

        {activeTab === 'payment' && (
          <div className="space-y-2 font-mono text-[11px]">
            <p className="console-label mb-2">x402 Payment Receipt</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { label: 'Protocol', value: 'x402 Micropayment' },
                { label: 'Network', value: 'Algorand TestNet' },
                { label: 'Amount', value: '0.01 USDC (10,000 micro-USDC)', highlight: true },
                { label: 'Settlement', value: paymentInfo?.settledAt || 'Instant (< 1s)' },
              ].map(({ label, value, highlight }) => (
                <div key={label} className="border border-slate-800 rounded bg-slate-900/60 px-3 py-2">
                  <span className="text-slate-600 block text-[10px] mb-0.5">{label}</span>
                  <span className={highlight ? 'text-cyan-300 font-semibold' : 'text-slate-300'}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
            {paymentInfo?.txHash && (
              <div className="border border-slate-800 rounded bg-slate-900/60 px-3 py-2">
                <span className="text-slate-600 block text-[10px] mb-0.5">Algorand Transaction ID</span>
                <span className="text-indigo-300 break-all select-all">{paymentInfo.txHash}</span>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
