import React from 'react';
import { CheckCircle2, Lock, Terminal } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <section className="border-b border-slate-800 bg-slate-950 py-7 sm:py-9">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Headline + description */}
        <div className="max-w-3xl space-y-3">
          <p className="console-label">Independent Verification Console</p>

          <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            AI shouldn't grade its{' '}
            <span className="text-cyan-500">own homework.</span>
          </h1>

          <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
            When autonomous agents generate code or structured payloads, self-evaluation leads
            to hallucinated correctness.{' '}
            <strong className="text-slate-200 font-semibold">Verdict404</strong> provides an
            independent, pay-per-use verification layer over{' '}
            <span className="font-mono text-cyan-400">x402</span> on Algorand —
            returning impartial <span className="font-mono text-green-400">PASS</span>{' '}
            / <span className="font-mono text-red-400">FAIL</span>{' '}
            / <span className="font-mono text-amber-400">ERROR</span> with an evidence trace.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span>Deterministic Invariants</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-cyan-500" />
              <span>0.01 USDC x402 Metering</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Terminal className="h-3.5 w-3.5 text-slate-500" />
              <span>Algorand TestNet Settlement</span>
            </div>
          </div>
        </div>

        {/* Inline pipeline flow — compact, horizontal */}
        <div className="mt-6 flex flex-wrap items-center gap-1.5 font-mono text-[11px] text-slate-600">
          {[
            { label: 'INPUT', color: 'text-slate-400' },
            null,
            { label: 'POST /verify', color: 'text-cyan-600' },
            null,
            { label: 'HTTP 402', color: 'text-amber-600' },
            null,
            { label: '0.01 USDC', color: 'text-indigo-500' },
            null,
            { label: 'ALGORAND', color: 'text-slate-500' },
            null,
            { label: 'VERIFICATION', color: 'text-cyan-600' },
            null,
            { label: 'VERDICT', color: 'text-slate-300' },
          ].map((item, i) =>
            item === null ? (
              <span key={i} className="text-slate-700 select-none">→</span>
            ) : (
              <span key={i} className={item.color}>{item.label}</span>
            )
          )}
        </div>

      </div>
    </section>
  );
};
