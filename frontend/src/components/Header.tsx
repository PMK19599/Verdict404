import React from 'react';
import { ShieldCheck, Activity, Sparkles, Info } from 'lucide-react';
import { GatewayHealth } from '../types/verdict';

interface HeaderProps {
  health: GatewayHealth | null;
  isMockMode: boolean;
  onToggleMock: (enabled: boolean) => void;
  onOpenArchitecture: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  health,
  isMockMode,
  onToggleMock,
  onOpenArchitecture,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-navy-950/90 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 p-0.5 shadow-lg shadow-cyan-500/20">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
                <ShieldCheck className="h-5 w-5 text-cyan-400" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xl font-bold tracking-tight text-white">
                  Verdict<span className="text-cyan-400">404</span>
                </span>
                <span className="hidden rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 font-mono text-[11px] font-medium text-cyan-300 sm:inline-block">
                  x402 Protocol
                </span>
              </div>
              <p className="hidden text-xs text-slate-400 md:block">
                Independent AI Verification Infrastructure
              </p>
            </div>
          </div>

          {/* Center: Tagline Chip */}
          <div className="hidden lg:flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-3.5 py-1 text-xs text-slate-300">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span className="font-medium italic">"AI shouldn't grade its own homework."</span>
          </div>

          {/* Right: Network status & Environment Switcher */}
          <div className="flex items-center gap-3">
            {/* Gateway Health Indicator */}
            <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              <span className="hidden sm:inline text-slate-400 font-mono">Algorand TestNet</span>
              <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-cyan-300">
                {health?.status === 'running' ? '0.01 USDC' : 'Ready'}
              </span>
            </div>

            {/* Architecture Explainer Button */}
            <button
              onClick={onOpenArchitecture}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-700 hover:text-white"
              title="How Verdict404 Works"
            >
              <Info className="h-3.5 w-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Architecture</span>
            </button>

            {/* Mock / Real Toggle */}
            <button
              onClick={() => onToggleMock(!isMockMode)}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-mono transition ${
                isMockMode
                  ? 'border-indigo-500/40 bg-indigo-950/40 text-indigo-300 hover:bg-indigo-900/40'
                  : 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/40'
              }`}
              title="Toggle between Mock Service & Real Gateway"
            >
              <Activity className="h-3.5 w-3.5" />
              <span>{isMockMode ? 'Mock Sandbox' : 'Live Gateway'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
