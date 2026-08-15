import React from 'react';
import { CheckCircle2, Zap, Lock, Terminal } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <section className="relative overflow-hidden py-8 sm:py-10 border-b border-slate-800/60 bg-gradient-to-b from-navy-950 via-slate-950 to-navy-950">
      <div className="ambient-glow"></div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          {/* Left Column: Mission & Value Prop */}
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3 py-1 text-xs font-mono text-cyan-300 backdrop-blur-md">
              <Zap className="h-3.5 w-3.5 text-cyan-400" />
              <span>Decentralized Verification Protocol for Autonomous Agents</span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
              AI shouldn't grade its <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">own homework.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              When autonomous agents generate code or structured payloads, self-evaluation leads to hallucinated correctness.
              <strong className="text-white font-semibold"> Verdict404</strong> provides an independent, paid verification layer over
              <span className="text-cyan-300 font-mono"> x402</span> on Algorand for impartial PASS / FAIL / ERROR verdicts.
            </p>

            {/* Micro Feature Badges */}
            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Deterministic Invariants</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-cyan-400" />
                <span>0.01 USDC x402 Metering</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Terminal className="h-4 w-4 text-indigo-400" />
                <span>Algorand TestNet Settle</span>
              </div>
            </div>
          </div>

          {/* Right Column: Visual 4-Step Verification Workflow Card */}
          <div className="w-full lg:max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <span className="font-mono text-xs uppercase tracking-wider text-slate-400">
                Autonomous Verification Loop
              </span>
              <span className="rounded bg-cyan-950 px-2 py-0.5 font-mono text-[11px] font-semibold text-cyan-300 border border-cyan-800/60">
                POST /verify
              </span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-start gap-3 rounded-lg border border-slate-800/80 bg-slate-950/60 p-2.5">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-950 text-[11px] font-bold text-cyan-400 border border-cyan-800">
                  1
                </div>
                <div>
                  <div className="font-semibold text-slate-200">Agent Dispatches Code</div>
                  <div className="text-[11px] text-slate-400">Payload submitted without trusted self-grade</div>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-slate-800/80 bg-slate-950/60 p-2.5">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-950 text-[11px] font-bold text-amber-400 border border-amber-800">
                  2
                </div>
                <div>
                  <div className="font-semibold text-slate-200">HTTP 402 Payment Required</div>
                  <div className="text-[11px] text-slate-400">Gateway responds with 0.01 USDC x402 invoice</div>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-slate-800/80 bg-slate-950/60 p-2.5">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-950 text-[11px] font-bold text-indigo-400 border border-indigo-800">
                  3
                </div>
                <div>
                  <div className="font-semibold text-slate-200">Algorand Settlement</div>
                  <div className="text-[11px] text-slate-400">x402 Facilitator verifies on-chain micropayment</div>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-slate-800/80 bg-slate-950/60 p-2.5">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-950 text-[11px] font-bold text-emerald-400 border border-emerald-800">
                  4
                </div>
                <div>
                  <div className="font-semibold text-emerald-400">Independent Verdict Issued</div>
                  <div className="text-[11px] text-slate-400">PASS / FAIL / ERROR with itemized evidence trace</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
