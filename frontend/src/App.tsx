import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { TaskSelector } from './components/TaskSelector';
import { CodeEditor } from './components/CodeEditor';
import { VerificationPipeline } from './components/VerificationPipeline';
import { ResultView } from './components/ResultView';
import { ArchitectureModal } from './components/ArchitectureModal';
import { TASK_CONFIGS } from './data/presets';
import {
  TaskType,
  VerificationState,
  VerifyResponse,
  PaymentSimulationInfo,
  PresetItem,
  GatewayHealth,
} from './types/verdict';
import { verificationService } from './services/api';
import { ShieldCheck, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  // State — unchanged from original
  const [selectedTask, setSelectedTask] = useState<TaskType>('safe_divide');
  const [code, setCode] = useState<string>(TASK_CONFIGS.safe_divide.defaultCode);
  const [verificationState, setVerificationState] = useState<VerificationState>('IDLE');
  const [statusMessage, setStatusMessage] = useState<string>('Ready to verify code with x402.');
  const [paymentInfo, setPaymentInfo] = useState<PaymentSimulationInfo | null>(null);
  const [result, setResult] = useState<VerifyResponse | null>(null);
  const [gatewayHealth, setGatewayHealth] = useState<GatewayHealth | null>(null);
  const [isMockMode, setIsMockMode] = useState<boolean>(true);
  const [isArchitectureOpen, setIsArchitectureOpen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize & fetch Gateway health on mount — unchanged
  useEffect(() => {
    fetchHealth();
  }, [isMockMode]);

  const fetchHealth = async () => {
    try {
      const health = await verificationService.getGatewayHealth();
      setGatewayHealth(health);
    } catch (err: any) {
      console.warn('Gateway health check failed:', err);
      setGatewayHealth(null);
    }
  };

  // Handle task change — unchanged
  const handleTaskChange = (newTask: TaskType) => {
    setSelectedTask(newTask);
    setCode(TASK_CONFIGS[newTask].defaultCode);
    handleReset();
  };

  // Handle quick preset selection — unchanged
  const handleSelectPreset = (preset: PresetItem) => {
    setCode(preset.code);
    handleReset();
  };

  // Reset to initial IDLE state — unchanged
  const handleReset = () => {
    setVerificationState('IDLE');
    setStatusMessage('Ready to verify code with x402.');
    setPaymentInfo(null);
    setResult(null);
    setErrorMessage(null);
  };

  // Toggle mock sandbox mode — unchanged
  const handleToggleMock = (enabled: boolean) => {
    setIsMockMode(enabled);
    verificationService.setMockMode(enabled);
    handleReset();
  };

  // Run verification — unchanged
  const handleVerify = async () => {
    if (!code.trim()) {
      setErrorMessage('Please enter or select code to verify.');
      return;
    }

    setErrorMessage(null);
    setResult(null);

    const taskConfig = TASK_CONFIGS[selectedTask];
    const request = {
      task: selectedTask,
      language: taskConfig.language,
      code: code,
    };

    try {
      const response = await verificationService.verify(request, {
        onStateChange: (state, message) => {
          setVerificationState(state);
          if (message) setStatusMessage(message);
        },
        onPaymentInfo: (info) => {
          setPaymentInfo(info);
        },
      });

      setResult(response);
    } catch (err: any) {
      setVerificationState('ERROR');
      setStatusMessage(`Verification failed: ${err?.message || err}`);
      setErrorMessage(err?.message || 'Verification pipeline encountered an error.');
    }
  };

  const isProcessing =
    verificationState === 'REQUESTING' ||
    verificationState === 'PAYMENT_REQUIRED' ||
    verificationState === 'PAYING' ||
    verificationState === 'PAYMENT_SETTLED' ||
    verificationState === 'VERIFYING';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-200">

      {/* Header */}
      <Header
        health={gatewayHealth}
        isMockMode={isMockMode}
        onToggleMock={handleToggleMock}
        onOpenArchitecture={() => setIsArchitectureOpen(true)}
      />

      {/* Hero */}
      <Hero />

      {/* Main Verification Workspace */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ── Left Column (Inputs) — 7 cols ── */}
          <div className="lg:col-span-7 space-y-7">

            {/* Step 01 — Target Selection */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-2 border-b border-slate-800 pb-2">
                <span className="font-mono text-[10px] text-slate-600 select-none">01</span>
                <h2 className="font-mono text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Select Verification Target
                </h2>
                <span className="ml-auto font-mono text-[10px] text-slate-600">
                  {selectedTask === 'safe_divide' ? 'safe_divide · Python' : 'validate_json · JSON'}
                </span>
              </div>
              <TaskSelector
                selectedTask={selectedTask}
                onSelectTask={handleTaskChange}
                onSelectPreset={handleSelectPreset}
                disabled={isProcessing}
              />
            </div>

            {/* Step 02 — Code / Payload Editor */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-2 border-b border-slate-800 pb-2">
                <span className="font-mono text-[10px] text-slate-600 select-none">02</span>
                <h2 className="font-mono text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Code / Payload Input
                </h2>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setCode(TASK_CONFIGS[selectedTask].defaultCode)}
                  className="ml-auto flex items-center gap-1 font-mono text-[10px] text-slate-600 hover:text-slate-400 transition disabled:opacity-40"
                >
                  <RefreshCw className="h-2.5 w-2.5" />
                  Restore Default
                </button>
              </div>
              <CodeEditor
                task={selectedTask}
                code={code}
                onChange={setCode}
                disabled={isProcessing}
              />
            </div>

            {/* Step 03 — Verify Action Bar */}
            <div className="border-t border-slate-800 pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                {/* Fee info */}
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-500"></span>
                    Verification Fee:{' '}
                    <strong className="text-white">0.01 USDC</strong>
                  </div>
                  <div className="font-mono text-[10px] text-slate-600 pl-3.5">
                    Protocol: x402 · Network: Algorand TestNet · Endpoint:{' '}
                    <code className="text-slate-500">POST /verify</code>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={handleReset}
                    className="rounded border border-slate-800 bg-slate-900 px-4 py-2 font-mono text-xs text-slate-400 hover:border-slate-700 hover:text-slate-200 transition disabled:opacity-40"
                  >
                    Reset
                  </button>

                  <button
                    id="btn-verify-x402"
                    type="button"
                    disabled={isProcessing || !code.trim()}
                    onClick={handleVerify}
                    className="btn-verify"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>Verify with x402</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Error message */}
              {errorMessage && (
                <div className="mt-3 flex items-center gap-2 rounded border border-red-900/50 bg-red-950/30 px-3 py-2 font-mono text-xs text-red-300">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

          </div>

          {/* ── Right Column (Pipeline + Result) — 5 cols ── */}
          <div className="lg:col-span-5 space-y-5">

            {/* Verification Pipeline */}
            <VerificationPipeline
              state={verificationState}
              statusMessage={statusMessage}
              paymentInfo={paymentInfo}
              finalVerdict={result?.verdict}
            />

            {/* Result view or idle placeholder */}
            {result ? (
              <ResultView
                result={result}
                paymentInfo={paymentInfo}
                onReset={handleReset}
                onRetry={handleVerify}
              />
            ) : (
              <div className="border border-dashed border-slate-800 rounded p-8 text-center space-y-2.5">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded border border-slate-800 bg-slate-900 text-slate-600">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <p className="font-mono text-xs font-semibold text-slate-500">
                  Awaiting Verification Request
                </p>
                <p className="text-[11px] text-slate-600 max-w-xs mx-auto leading-relaxed">
                  Select a target and click{' '}
                  <strong className="text-slate-500">Verify with x402</strong>{' '}
                  to initiate the payment challenge and receive an independent verdict.
                </p>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-5 font-mono text-[11px] text-slate-600">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">Verdict404</span>
            <span>·</span>
            <span>Independent Verification Infrastructure for AI Agents</span>
          </div>
          <div className="flex items-center gap-3 text-slate-600">
            <span>Algorand TestNet</span>
            <span>·</span>
            <span>x402 Protocol v0.2</span>
            <span>·</span>
            <span className="text-cyan-600">0.01 USDC / run</span>
          </div>
        </div>
      </footer>

      {/* Architecture Modal */}
      <ArchitectureModal
        isOpen={isArchitectureOpen}
        onClose={() => setIsArchitectureOpen(false)}
      />
    </div>
  );
};

export default App;
