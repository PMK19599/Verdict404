import React from 'react';
import { X, ShieldCheck, ArrowRight, Coins, CheckCircle } from 'lucide-react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl rounded-3xl border border-slate-700/80 bg-slate-900/95 p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Verdict404 Architecture</h2>
            <p className="text-xs text-slate-400">
              Independent Verification Infrastructure for Autonomous AI Agents
            </p>
          </div>
        </div>

        {/* Core Architecture Diagram */}
        <div className="my-6 rounded-2xl border border-slate-800 bg-slate-950/80 p-5 font-mono text-xs space-y-4">
          <div className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
            System Dataflow & Protocol Topology
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-center">
            {/* Box 1 */}
            <div className="flex-1 w-full rounded-xl border border-slate-800 bg-slate-900/80 p-3">
              <div className="text-cyan-400 font-bold text-sm">AI Agent / Client</div>
              <div className="text-[11px] text-slate-400 mt-1">Generates code & payloads</div>
              <div className="mt-2 text-[10px] text-slate-500 rounded bg-slate-950 p-1">
                POST /verify
              </div>
            </div>

            <ArrowRight className="h-5 w-5 text-slate-600 rotate-90 md:rotate-0" />

            {/* Box 2 */}
            <div className="flex-1 w-full rounded-xl border border-cyan-500/40 bg-cyan-950/20 p-3">
              <div className="text-cyan-300 font-bold text-sm">x402 Gateway</div>
              <div className="text-[11px] text-slate-400 mt-1">HTTP 402 Metering</div>
              <div className="mt-2 text-[10px] text-cyan-400 rounded bg-cyan-950 p-1 border border-cyan-800">
                0.01 USDC on Algorand
              </div>
            </div>

            <ArrowRight className="h-5 w-5 text-slate-600 rotate-90 md:rotate-0" />

            {/* Box 3 */}
            <div className="flex-1 w-full rounded-xl border border-indigo-500/40 bg-indigo-950/20 p-3">
              <div className="text-indigo-300 font-bold text-sm">Verification Engine</div>
              <div className="text-[11px] text-slate-400 mt-1">AST & Invariant Analysis</div>
              <div className="mt-2 text-[10px] text-emerald-400 rounded bg-slate-950 p-1">
                PASS / FAIL / ERROR
              </div>
            </div>
          </div>
        </div>

        {/* Key Security Principles */}
        <div className="space-y-3 text-xs sm:text-sm text-slate-300">
          <h3 className="font-semibold text-white text-base">Key Architectural Principles</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3.5 space-y-1.5">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs">
                <Coins className="h-4 w-4" />
                <span>Zero Browser Signing Keys</span>
              </div>
              <p className="text-xs text-slate-400">
                No mnemonics, private keys, or wallet secrets are ever shipped to browser client code.
                All x402 payments are metered and coordinated via autonomous facilitator nodes.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3.5 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                <CheckCircle className="h-4 w-4" />
                <span>Independent Verification</span>
              </div>
              <p className="text-xs text-slate-400">
                Self-evaluation causes systemic bias and hallucinations in LLMs. Verdict404 provides an
                external, unhackable referee for deterministic code safety.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-cyan-500 px-5 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 transition shadow-lg shadow-cyan-500/20"
          >
            Got it, return to App
          </button>
        </div>
      </div>
    </div>
  );
};
