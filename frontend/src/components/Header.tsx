import React from 'react';
import { ShieldCheck, Activity, Info, Wallet, LogOut } from 'lucide-react';
import { GatewayHealth } from '../types/verdict';
import { useWallet } from '@txnlab/use-wallet-react';

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
  const {
    wallets,
    activeWallet,
    activeAddress,
    isReady,
  } = useWallet();

  const handleConnect = async () => {
    if (!isReady) return;

    try {
      const availableWallet =
        wallets.find((wallet) => wallet.id === 'pera') ??
        wallets.find((wallet) => wallet.id === 'defly') ??
        wallets[0];

      if (!availableWallet) {
        console.warn('No supported Algorand wallet detected.');
        return;
      }

      await availableWallet.connect();
    } catch (error) {
      console.error('Wallet connection failed:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await activeWallet?.disconnect();
    } catch (error) {
      console.error('Wallet disconnect failed:', error);
    }
  };

  const shortAddress = activeAddress
    ? `${activeAddress.slice(0, 6)}...${activeAddress.slice(-4)}`
    : null;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/95">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-13 items-center justify-between gap-4 py-3">

          {/* Brand */}
          <div className="flex items-center gap-3 min-w-0">
            <ShieldCheck className="h-5 w-5 shrink-0 text-cyan-500" />

            <div className="flex items-center gap-2.5 min-w-0">
              <span className="font-mono text-sm font-bold tracking-tight text-white">
                Verdict<span className="text-cyan-500">404</span>
              </span>

              <span className="hidden rounded border border-cyan-800/60 bg-cyan-950/60 px-1.5 py-0.5 font-mono text-[10px] font-medium text-cyan-400 sm:inline-block">
                x402
              </span>

              <span className="hidden text-slate-600 md:inline">·</span>

              <span className="hidden truncate font-mono text-[11px] text-slate-500 md:inline">
                Independent Verification Infrastructure
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">

            {/* Network */}
            <div className="hidden sm:flex items-center gap-1.5 rounded border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 font-mono text-[11px]">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>

              <span className="text-slate-400">
                Algorand TestNet
              </span>

              <span className="text-slate-600">·</span>

              <span className="font-semibold text-cyan-400">
                {health?.status === 'running' ? '0.01 USDC' : '0.01 USDC'}
              </span>
            </div>

            {/* Wallet */}
            {activeWallet && activeAddress ? (
              <button
                type="button"
                onClick={handleDisconnect}
                className="flex items-center gap-1.5 rounded border border-emerald-800/60 bg-emerald-950/50 px-2.5 py-1.5 font-mono text-[11px] text-emerald-400 transition hover:bg-emerald-900/50"
                title="Disconnect wallet"
              >
                <Wallet className="h-3 w-3" />

                <span className="hidden sm:inline">
                  {activeWallet.metadata.name}
                </span>

                <span>{shortAddress}</span>

                <LogOut className="h-3 w-3" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConnect}
                disabled={!isReady}
                className="flex items-center gap-1.5 rounded border border-cyan-800/60 bg-cyan-950/50 px-2.5 py-1.5 font-mono text-[11px] text-cyan-400 transition hover:bg-cyan-900/50 disabled:cursor-not-allowed disabled:opacity-50"
                title="Connect Algorand wallet"
              >
                <Wallet className="h-3 w-3" />
                <span>
                  {isReady ? 'Connect Wallet' : 'Loading Wallets...'}
                </span>
              </button>
            )}

            {/* Architecture */}
            <button
              type="button"
              onClick={onOpenArchitecture}
              className="flex items-center gap-1 rounded border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 font-mono text-[11px] text-slate-400 transition hover:border-slate-700 hover:text-slate-200"
              title="How Verdict404 Works"
            >
              <Info className="h-3 w-3" />
              <span className="hidden sm:inline">Architecture</span>
            </button>

            {/* Mock / Live */}
            <button
              type="button"
              onClick={() => onToggleMock(!isMockMode)}
              className={`flex items-center gap-1 rounded border px-2.5 py-1.5 font-mono text-[11px] transition ${
                isMockMode
                  ? 'border-indigo-800/60 bg-indigo-950/50 text-indigo-400 hover:bg-indigo-900/50'
                  : 'border-emerald-800/60 bg-emerald-950/50 text-emerald-400 hover:bg-emerald-900/50'
              }`}
              title="Toggle Mock Sandbox / Live Gateway"
            >
              <Activity className="h-3 w-3" />
              <span>{isMockMode ? 'Mock' : 'Live'}</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};