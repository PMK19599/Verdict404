import React from 'react';
import { TaskType, PresetItem } from '../types/verdict';
import { TASK_CONFIGS, TaskConfig } from '../data/presets';
import { FileCode, FileJson, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface TaskSelectorProps {
  selectedTask: TaskType;
  onSelectTask: (task: TaskType) => void;
  onSelectPreset: (preset: PresetItem) => void;
  disabled?: boolean;
}

export const TaskSelector: React.FC<TaskSelectorProps> = ({
  selectedTask,
  onSelectTask,
  onSelectPreset,
  disabled = false,
}) => {
  const currentConfig: TaskConfig = TASK_CONFIGS[selectedTask];

  return (
    <div className="space-y-5">

      {/* ── Verification Target Selector ── */}
      <div className="space-y-2">
        <p className="console-label">Verification Target</p>
        <div className="flex flex-col sm:flex-row gap-2">

          {/* safe_divide */}
          <button
            type="button"
            id="task-safe-divide"
            disabled={disabled}
            onClick={() => onSelectTask('safe_divide')}
            className={`flex-1 text-left border rounded px-4 py-3 transition-all ${
              selectedTask === 'safe_divide'
                ? 'task-btn-active border-cyan-600 bg-cyan-950/20'
                : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900/80'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="flex items-center gap-2.5 mb-1">
              <FileCode className={`h-4 w-4 shrink-0 ${selectedTask === 'safe_divide' ? 'text-cyan-400' : 'text-slate-500'}`} />
              <span className={`font-mono text-sm font-bold ${selectedTask === 'safe_divide' ? 'text-white' : 'text-slate-300'}`}>
                safe_divide
              </span>
              <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-slate-500 border border-slate-800 px-1.5 py-0.5 rounded">
                Python 3
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono">
              Code · Zero-division guard verification
            </p>
          </button>

          {/* validate_json */}
          <button
            type="button"
            id="task-validate-json"
            disabled={disabled}
            onClick={() => onSelectTask('validate_json')}
            className={`flex-1 text-left border rounded px-4 py-3 transition-all ${
              selectedTask === 'validate_json'
                ? 'task-btn-active border-cyan-600 bg-cyan-950/20'
                : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900/80'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="flex items-center gap-2.5 mb-1">
              <FileJson className={`h-4 w-4 shrink-0 ${selectedTask === 'validate_json' ? 'text-cyan-400' : 'text-slate-500'}`} />
              <span className={`font-mono text-sm font-bold ${selectedTask === 'validate_json' ? 'text-white' : 'text-slate-300'}`}>
                validate_json
              </span>
              <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-slate-500 border border-slate-800 px-1.5 py-0.5 rounded">
                JSON Schema
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono">
              Schema · Structured payload validation
            </p>
          </button>

        </div>
      </div>

      {/* ── Verification Criteria ── */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="console-label">Verification Criteria</p>
          <span className="console-label">{currentConfig.rules.length} invariants</span>
        </div>
        <div className="border border-slate-800 rounded bg-slate-950/60">
          {currentConfig.rules.map((rule, idx) => (
            <div
              key={idx}
              className={`flex items-baseline gap-3 px-3 py-2 font-mono text-xs ${
                idx < currentConfig.rules.length - 1 ? 'border-b border-slate-800/60' : ''
              }`}
            >
              <span className="text-slate-600 shrink-0 select-none tabular-nums">
                {String(idx + 1).padStart(2, '0')}
              </span>
              <span className="text-slate-300">{rule}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Judge Test Cases ── */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="console-label">Judge Test Cases</p>
          <span className="console-label">click to load</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {currentConfig.presets.map((preset) => {
            let colorClass = 'border-emerald-800/50 text-emerald-400 hover:bg-emerald-950/40';
            let Icon = CheckCircle;
            let verdictColor = 'text-emerald-500';
            if (preset.expectedVerdict === 'FAIL') {
              colorClass = 'border-red-800/50 text-red-400 hover:bg-red-950/40';
              Icon = XCircle;
              verdictColor = 'text-red-500';
            } else if (preset.expectedVerdict === 'ERROR') {
              colorClass = 'border-amber-800/50 text-amber-400 hover:bg-amber-950/40';
              Icon = AlertTriangle;
              verdictColor = 'text-amber-500';
            }

            return (
              <button
                key={preset.id}
                id={`preset-${preset.id}`}
                type="button"
                disabled={disabled}
                onClick={() => onSelectPreset(preset)}
                title={preset.description}
                className={`flex items-center gap-1.5 rounded border bg-slate-950/50 px-2.5 py-1.5 font-mono text-[11px] transition ${colorClass} ${
                  disabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Icon className="h-3 w-3 shrink-0" />
                <span>{preset.title}</span>
                <span className={`font-bold ${verdictColor}`}>
                  →{preset.expectedVerdict}
                </span>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};
