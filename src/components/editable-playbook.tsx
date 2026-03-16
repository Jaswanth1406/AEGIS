import React, { useState } from "react";
import { Play, Plus, Trash2, Edit2, Check } from "lucide-react";

export interface PlaybookStep {
  action: string;
  params: Record<string, any>;
}

interface EditablePlaybookProps {
  initialSteps: PlaybookStep[];
  onApprove: (steps: PlaybookStep[]) => Promise<void>;
  onDismiss: () => void;
}

const AVAILABLE_ACTIONS = [
  "block_ip",
  "isolate_subnet",
  "disable_user",
  "restart_service",
  "quarantine_host",
  "send_alert"
];

export function EditablePlaybook({ initialSteps, onApprove, onDismiss }: EditablePlaybookProps) {
  const [steps, setSteps] = useState<PlaybookStep[]>(initialSteps || []);
  const [isEditing, setIsEditing] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const handleActionChange = (index: number, newAction: string) => {
    const updated = [...steps];
    updated[index].action = newAction;
    // reset params when action changes somewhat, or keep if generic
    setSteps(updated);
  };

  const handleParamChange = (stepIndex: number, paramKey: string, newValue: string) => {
    const updated = [...steps];
    updated[stepIndex].params = { ...updated[stepIndex].params, [paramKey]: newValue };
    setSteps(updated);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const addStep = () => {
    setSteps([...steps, { action: "block_ip", params: { ip: "" } }]);
  };

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await onApprove(steps);
    } finally {
      setIsApproving(false);
    }
  };

  if (!isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end mb-2">
          <button onClick={() => setIsEditing(true)} className="flex items-center gap-1 text-xs text-accent-blue hover:text-accent-blue/80 transition-colors">
            <Edit2 className="h-3 w-3" /> Edit Playbook
          </button>
        </div>
        <div className="space-y-3">
          {steps.map((step, idx) => (
            <div key={idx} className="bg-surface border border-border/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-5 w-5 rounded bg-accent-green/10 flex items-center justify-center text-[10px] font-bold text-accent-green">
                  {idx + 1}
                </div>
                <span className="text-sm font-medium text-text">{step.action}</span>
              </div>
              <div className="space-y-1 pl-7">
                {Object.entries(step.params || {}).map(([k, v]) => (
                  <div key={k} className="text-xs text-muted flex items-start gap-2">
                    <span className="font-mono">{k}:</span>
                    <span className="text-text">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-3">
          <button
            onClick={handleApprove}
            disabled={isApproving}
            className="flex-1 py-1.5 bg-accent-green/10 text-accent-green hover:bg-accent-green/20 text-xs font-semibold rounded-lg border border-accent-green/30 transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
          >
            {isApproving ? "Approving..." : <><Play className="h-3 w-3" /> Approve & Execute</>}
          </button>
          <button
            onClick={onDismiss}
            className="px-3 py-1.5 bg-surface text-muted hover:text-accent-red text-xs font-medium rounded-lg border border-border transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  // Edit Mode
  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-2">
        <button onClick={() => setIsEditing(false)} className="flex items-center gap-1 text-xs text-accent-green hover:text-accent-green/80 transition-colors">
          <Check className="h-3 w-3" /> Done Editing
        </button>
      </div>
      <div className="space-y-3">
        {steps.map((step, idx) => (
          <div key={idx} className="bg-surface2 border border-border rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1">
                <div className="h-5 w-5 rounded bg-surface flex items-center justify-center text-[10px] font-bold text-text border border-border">
                  {idx + 1}
                </div>
                <select 
                  value={step.action}
                  onChange={(e) => handleActionChange(idx, e.target.value)}
                  className="bg-surface border border-border text-text text-sm rounded px-2 py-1 outline-none flex-1"
                >
                  {AVAILABLE_ACTIONS.map(act => <option key={act} value={act}>{act}</option>)}
                </select>
              </div>
              <button onClick={() => removeStep(idx)} className="text-muted hover:text-accent-red p-1 ml-2 transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            
            {/* Params editor */}
            <div className="pl-7 space-y-2">
              {Object.entries(step.params || {}).map(([k, v]) => (
                <div key={k} className="flex flex-col gap-1">
                  <label className="text-[10px] text-muted font-mono uppercase">{k}</label>
                  <input
                    type="text"
                    value={String(v)}
                    onChange={(e) => handleParamChange(idx, k, e.target.value)}
                    className="bg-surface border border-border text-text text-sm rounded px-2 py-1 w-full outline-none focus:border-accent-blue transition-colors"
                  />
                </div>
              ))}
              
              {Object.keys(step.params || {}).length === 0 && (
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-muted font-mono uppercase">Target / IP / Config</label>
                  <input
                    type="text"
                    placeholder="Enter parameter value..."
                    onChange={(e) => handleParamChange(idx, "target", e.target.value)}
                    className="bg-surface border border-border text-text text-sm rounded px-2 py-1 w-full outline-none focus:border-accent-blue transition-colors"
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <button onClick={addStep} className="w-full py-2 border-2 border-dashed border-border rounded-lg text-muted hover:text-text hover:border-text transition-colors flex items-center justify-center gap-2 text-sm font-medium">
        <Plus className="h-4 w-4" /> Add Step
      </button>

      <div className="flex gap-2 pt-2 border-t border-border mt-4">
        <button
          onClick={handleApprove}
          disabled={isApproving}
          className="flex-1 py-1.5 bg-accent-green/10 text-accent-green hover:bg-accent-green/20 text-xs font-semibold rounded-lg border border-accent-green/30 transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
        >
          {isApproving ? "Approving..." : <><Play className="h-3 w-3" /> Approve (Edited)</>}
        </button>
        <button
          onClick={onDismiss}
          className="px-3 py-1.5 bg-surface text-muted hover:text-accent-red text-xs font-medium rounded-lg border border-border transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
