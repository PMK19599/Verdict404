import React, { useState } from 'react';
import { Copy, Check, Trash2, Wand2, Code2, AlertCircle } from 'lucide-react';
import { TaskType } from '../types/verdict';

interface CodeEditorProps {
  task: TaskType;
  code: string;
  onChange: (code: string) => void;
  disabled?: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  task,
  code,
  onChange,
  disabled = false,
}) => {
  const [copied, setCopied] = useState(false);
  const language = task === 'safe_divide' ? 'python' : 'json';

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleFormat = () => {
    if (task === 'validate_json') {
      try {
        const parsed = JSON.parse(code);
        onChange(JSON.stringify(parsed, null, 2));
      } catch (e) {
        // Can't format malformed JSON
      }
    }
  };

  // Basic client-side syntax hint
  let syntaxWarning: string | null = null;
  if (task === 'validate_json' && code.trim()) {
    try {
      JSON.parse(code);
    } catch (e: any) {
      syntaxWarning = `Invalid JSON syntax: ${e.message}`;
    }
  } else if (task === 'safe_divide' && code.trim()) {
    if (!code.includes('def divide')) {
      syntaxWarning = 'Python function must be named `def divide(...)`.';
    }
  }

  const lines = code.split('\n');

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl flex flex-col">
      {/* Editor Top Bar */}
      <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/90 px-4 py-2.5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-rose-500/80 inline-block"></span>
            <span className="h-3 w-3 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="h-3 w-3 rounded-full bg-emerald-500/80 inline-block"></span>
          </div>
          <span className="h-4 w-[1px] bg-slate-800"></span>
          <div className="flex items-center gap-1.5 font-mono text-xs text-slate-300">
            <Code2 className="h-3.5 w-3.5 text-cyan-400" />
            <span>{task === 'safe_divide' ? 'agent_payload.py' : 'agent_output.json'}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {task === 'validate_json' && (
            <button
              type="button"
              disabled={disabled}
              onClick={handleFormat}
              className="flex items-center gap-1 rounded px-2 py-1 text-xs font-mono text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition disabled:opacity-50"
              title="Prettify JSON"
            >
              <Wand2 className="h-3 w-3 text-cyan-400" />
              <span>Format</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs font-mono text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
            title="Copy code"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange('')}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs font-mono text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition disabled:opacity-50"
            title="Clear editor"
          >
            <Trash2 className="h-3 w-3" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Editor Area with simulated line numbers */}
      <div className="relative flex flex-1 min-h-[260px] max-h-[360px] bg-slate-950 font-mono text-sm overflow-hidden">
        {/* Line Numbers */}
        <div className="select-none bg-slate-900/40 px-3 py-3 text-right font-mono text-xs text-slate-600 border-r border-slate-900 min-w-[40px]">
          {lines.map((_, i) => (
            <div key={i} className="leading-6">
              {i + 1}
            </div>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          value={code}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          placeholder={
            task === 'safe_divide'
              ? '# Enter or paste Python code for divide(a, b)...'
              : '{\n  "name": "Agent",\n  "age": 30\n}'
          }
          spellCheck={false}
          className="flex-1 w-full resize-none bg-transparent p-3 font-mono text-xs sm:text-sm leading-6 text-slate-100 placeholder-slate-600 focus:outline-none disabled:opacity-60 overflow-y-auto"
        />
      </div>

      {/* Syntax hint / Warning Bar if any */}
      {syntaxWarning && (
        <div className="flex items-center gap-2 border-t border-amber-900/40 bg-amber-950/20 px-3 py-1.5 text-xs font-mono text-amber-300">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
          <span className="truncate">{syntaxWarning}</span>
        </div>
      )}

      {/* Editor Footer */}
      <div className="flex items-center justify-between border-t border-slate-900 bg-slate-900/60 px-3 py-1.5 text-[11px] font-mono text-slate-500">
        <div className="flex items-center gap-3">
          <span>
            {lines.length} {lines.length === 1 ? 'line' : 'lines'}
          </span>
          <span>{code.length} chars</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-400 uppercase">
            {language}
          </span>
          <span>UTF-8</span>
        </div>
      </div>
    </div>
  );
};
