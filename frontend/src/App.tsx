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
  // State
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

  // Initialize & fetch Gateway health on mount
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

  // Handle task change
  const handleTaskChange = (newTask: TaskType) => {
    setSelectedTask(newTask);
    setCode(TASK_CONFIGS[newTask].defaultCode);
    handleReset();
  };

  // Handle quick preset selection
  const handleSelectPreset = (preset: PresetItem) => {
    setCode(preset.code);
    handleReset();
  };

  // Reset to initial IDLE state
  const handleReset = () => {
    setVerificationState('IDLE');
    setStatusMessage('Ready to verify code with x402.');
    setPaymentInfo(null);
    setResult(null);
    setErrorMessage(null);
  };

  // Toggle mock sandbox mode
  const handleToggleMock = (enabled: boolean) => {
    setIsMockMode(enabled);
    verificationService.setMockMode(enabled);
    handleReset();
  };

  // Run verification
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
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Top Header */}
      <Header
        health={gatewayHealth}
        isMockMode={isMockMode}
        onToggleMock={handleToggleMock}
        onOpenArchitecture={() => setIsArchitectureOpen(true)}
      />

      {/* Hero Section */}
      <Hero />

      {/* Main Verification Workspace */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        {/* Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (Inputs, Task, Editor) - 7 Cols */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Task Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-xs font-bold">
                    1
                  </span>
                  <h2 className="font-bold text-base sm:text-lg text-white">
                    Select Verification Target
                  </h2>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {selectedTask === 'safe_divide' ? 'safe_divide (Python)' : 'validate_json (JSON)'}
                </span>
              </div>

              <TaskSelector
                selectedTask={selectedTask}
                onSelectTask={handleTaskChange}
                onSelectPreset={handleSelectPreset}
                disabled={isProcessing}
              />
            </div>

            {/* Step 2: Code Editor */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-xs font-bold">
                    2
                  </span>
                  <h2 className="font-bold text-base sm:text-lg text-white">
                    Autonomous Code / Payload Input
                  </h2>
                </div>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setCode(TASK_CONFIGS[selectedTask].defaultCode)}
                  className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-mono transition disabled:opacity-50"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Restore Default</span>
                </button>
              </div>

              <CodeEditor
                task={selectedTask}
                code={code}
                onChange={setCode}
                disabled={isProcessing}
              />
            </div>

            {/* Step 3: Action & x402 Payment Bar */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl backdrop-blur-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                    <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
                    <span>
                      Verification Fee:{' '}
                      <strong className="text-white font-semibold">0.01 USDC</strong>
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Protocol: x402 on Algorand TestNet · Endpoint: <code className="text-slate-400">/verify</code>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={handleReset}
                    className="rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-3 text-xs font-mono font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition disabled:opacity-50"
                  >
                    Reset
                  </button>

                  <button
                    type="button"
                    disabled={isProcessing || !code.trim()}
                    onClick={handleVerify}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-500/40 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                        <span>Verifying with x402...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4" />
                        <span>Verify with x402</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-950/30 p-2.5 text-xs text-rose-300 font-mono">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column (Pipeline State & Result View) - 5 Cols */}
          <div className="lg:col-span-5 space-y-6">
            {/* Verification Pipeline Tracker */}
            <VerificationPipeline
              state={verificationState}
              statusMessage={statusMessage}
              paymentInfo={paymentInfo}
              finalVerdict={result?.verdict}
            />

            {/* Verdict Result Display */}
            {result ? (
              <ResultView
                result={result}
                paymentInfo={paymentInfo}
                onReset={handleReset}
                onRetry={handleVerify}
              />
            ) : (
              /* Idle state card placeholder */
              <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 p-8 text-center space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-500">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="font-mono text-sm font-semibold text-slate-300">
                  Awaiting Verification Request
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Select a verifier task above or click <strong className="text-slate-400">Verify with x402</strong> to
                  initiate the 402 payment challenge and receive an independent verdict.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/90 py-6 font-mono text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">Verdict404</span>
            <span>·</span>
            <span>Independent Verification Infrastructure for AI Agents</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>Algorand TestNet</span>
            <span>·</span>
            <span>x402 Protocol v0.2</span>
            <span>·</span>
            <span className="text-cyan-400">0.01 USDC / run</span>
          </div>
        </div>
      </footer>

      {/* Architecture & Flow Modal */}
      <ArchitectureModal
        isOpen={isArchitectureOpen}
        onClose={() => setIsArchitectureOpen(false)}
      />
    </div>
  );
};

export default App;
