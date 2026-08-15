import React from 'react';
import { TaskType, PresetItem } from '../types/verdict';
import { TASK_CONFIGS, TaskConfig } from '../data/presets';
import { FileCode, FileJson, CheckCircle, AlertTriangle, XCircle, ListChecks } from 'lucide-react';

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
    <div className="space-y-4">
      {/* Task Tabs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onSelectTask('safe_divide')}
          className={`flex-1 rounded-xl p-4 text-left transition-all border ${
            selectedTask === 'safe_divide'
              ? 'border-cyan-500/50 bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-900 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/30'
              : 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/70 text-slate-400'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div
                className={`p-2 rounded-lg ${
                  selectedTask === 'safe_divide' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'
                }`}
              >
                <FileCode className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-mono font-bold text-sm text-white">safe_divide</h3>
                <span className="text-[11px] text-cyan-400 font-mono">Python 3</span>
              </div>
            </div>
            <span className="rounded bg-slate-800/90 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-slate-300 border border-slate-700">
              Code Verifier
            </span>
          </div>
          <p className="text-xs text-slate-400 line-clamp-2">
            Verifies safety guards & zero-division protection in Python functions.
          </p>
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => onSelectTask('validate_json')}
          className={`flex-1 rounded-xl p-4 text-left transition-all border ${
            selectedTask === 'validate_json'
              ? 'border-cyan-500/50 bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-900 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/30'
              : 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/70 text-slate-400'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div
                className={`p-2 rounded-lg ${
                  selectedTask === 'validate_json' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'
                }`}
              >
                <FileJson className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-mono font-bold text-sm text-white">validate_json</h3>
                <span className="text-[11px] text-cyan-400 font-mono">JSON Schema</span>
              </div>
            </div>
            <span className="rounded bg-slate-800/90 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-slate-300 border border-slate-700">
              Schema Verifier
            </span>
          </div>
          <p className="text-xs text-slate-400 line-clamp-2">
            Verifies structured AI output schema requirements and type constraints.
          </p>
        </button>
      </div>

      {/* Task Safety Rules / Invariant Checklist */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
            <ListChecks className="h-4 w-4 text-cyan-400" />
            <span>Verification Invariants & Rules ({currentConfig.rules.length})</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">{currentConfig.languageLabel}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          {currentConfig.rules.map((rule, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 rounded-lg bg-slate-950/60 px-2.5 py-1.5 border border-slate-800/60 font-mono text-slate-300"
            >
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-cyan-950 text-[10px] font-bold text-cyan-400 border border-cyan-800">
                {idx + 1}
              </span>
              <span className="truncate">{rule}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Judge Quick-Test Preset Buttons */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3.5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-slate-400">Quick Test Cases for Judges:</span>
          <span className="text-[10px] text-slate-500 font-mono">Click to load preset into editor</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {currentConfig.presets.map((preset) => {
            let badgeColor = 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/40';
            let Icon = CheckCircle;
            if (preset.expectedVerdict === 'FAIL') {
              badgeColor = 'border-rose-500/40 bg-rose-950/30 text-rose-300 hover:bg-rose-900/40';
              Icon = XCircle;
            } else if (preset.expectedVerdict === 'ERROR') {
              badgeColor = 'border-amber-500/40 bg-amber-950/30 text-amber-300 hover:bg-amber-900/40';
              Icon = AlertTriangle;
            }

            return (
              <button
                key={preset.id}
                type="button"
                disabled={disabled}
                onClick={() => onSelectPreset(preset)}
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${badgeColor} ${
                  disabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                title={preset.description}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{preset.title}</span>
                <span className="rounded bg-slate-950/60 px-1 py-0.2 font-mono text-[9px] uppercase font-bold">
                  {preset.expectedVerdict}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
