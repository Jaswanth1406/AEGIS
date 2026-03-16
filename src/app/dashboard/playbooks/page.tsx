"use client";

import { useState, useCallback } from "react";
import { AlertTriangle, CheckCircle, Play, RotateCw, Loader2 } from "lucide-react";
import { playbooks, generateNewThreat, type Threat, type Playbook } from "@/lib/mock-data";

interface PlaybookState {
  steps: { name: string; description: string; status: "pending" | "running" | "completed" }[];
  expanded: boolean;
}

export default function PlaybooksPage() {
  const [playbookStates, setPlaybookStates] = useState<Record<string, PlaybookState>>(() => {
    const initial: Record<string, PlaybookState> = {};
    playbooks.forEach((pb) => {
      initial[pb.id] = { steps: pb.steps.map((s) => ({ ...s, status: "pending" as const })), expanded: false };
    });
    return initial;
  });

  const [simulating, setSimulating] = useState(false);
  const [simulatedThreat, setSimulatedThreat] = useState<Threat | null>(null);
  const [simulatingPlaybookId, setSimulatingPlaybookId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setPlaybookStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], expanded: !prev[id].expanded },
    }));
  };

  const runPlaybook = useCallback((id: string) => {
    const state = playbookStates[id];
    if (!state) return;

    // Reset steps
    setPlaybookStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], expanded: true, steps: prev[id].steps.map((s) => ({ ...s, status: "pending" as const })) },
    }));

    // Animate steps
    state.steps.forEach((_, i) => {
      setTimeout(() => {
        setPlaybookStates((prev) => ({
          ...prev,
          [id]: {
            ...prev[id],
            steps: prev[id].steps.map((s, j) => ({
              ...s,
              status: j < i ? "completed" as const : j === i ? "running" as const : s.status,
            })),
          },
        }));
      }, i * 1500);

      setTimeout(() => {
        setPlaybookStates((prev) => ({
          ...prev,
          [id]: {
            ...prev[id],
            steps: prev[id].steps.map((s, j) => ({
              ...s,
              status: j <= i ? "completed" as const : s.status,
            })),
          },
        }));
      }, (i + 1) * 1500);
    });
  }, [playbookStates]);

  const resetPlaybook = (id: string) => {
    setPlaybookStates((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        steps: prev[id].steps.map((s) => ({ ...s, status: "pending" as const })),
      },
    }));
  };

  const simulateAttack = () => {
    setSimulating(true);
    const threat = generateNewThreat();
    setSimulatedThreat(threat);

    // Pick a random playbook
    const pbIndex = Math.floor(Math.random() * playbooks.length);
    const pbId = playbooks[pbIndex].id;
    setSimulatingPlaybookId(pbId);

    // Auto-expand and run that playbook after a delay
    setTimeout(() => {
      setSimulating(false);
      runPlaybook(pbId);
    }, 2000);
  };

  const getStepIcon = (status: string) => {
    if (status === "completed") return <CheckCircle className="h-5 w-5 text-accent-green" />;
    if (status === "running") return <Loader2 className="h-5 w-5 text-accent-blue animate-spin" />;
    return <div className="w-5 h-5 rounded-full border-2 border-border" />;
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text" style={{ fontFamily: "var(--font-syne), sans-serif" }}>Response Playbooks</h1>
          <p className="text-muted text-sm mt-1">Automated incident response workflows</p>
        </div>
        <button
          onClick={simulateAttack}
          disabled={simulating}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent-red/10 text-accent-red font-medium rounded-xl hover:bg-accent-red/20 transition-all border border-accent-red/30 disabled:opacity-50 text-sm"
        >
          {simulating ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
          {simulating ? "Simulating..." : "Simulate Attack"}
        </button>
      </div>

      {/* Simulated Threat Alert */}
      {simulatedThreat && (
        <div className="bg-accent-red/5 border border-accent-red/30 rounded-xl p-4 animate-slide-down flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-accent-red flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-accent-red">Simulated Attack Detected</h4>
            <p className="text-xs text-muted mt-1">{simulatedThreat.name} from {simulatedThreat.sourceIP} → {simulatedThreat.targetSystem}</p>
            {simulatingPlaybookId && (
              <p className="text-xs text-accent-green mt-1">Auto-executing: {playbooks.find((p) => p.id === simulatingPlaybookId)?.name} playbook</p>
            )}
          </div>
        </div>
      )}

      {/* Playbook Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {playbooks.map((pb) => {
          const state = playbookStates[pb.id];
          if (!state) return null;
          const allCompleted = state.steps.every((s) => s.status === "completed");
          const anyRunning = state.steps.some((s) => s.status === "running");

          return (
            <div key={pb.id} className={`bg-surface rounded-xl border ${simulatingPlaybookId === pb.id && !simulating ? "border-accent-green/50 shadow-lg glow-green" : "border-border"} transition-all`}>
              {/* Header */}
              <div className="p-6 cursor-pointer" onClick={() => toggleExpand(pb.id)}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">{pb.icon}</div>
                    <div>
                      <h3 className="text-lg font-semibold text-text">{pb.name}</h3>
                      <p className="text-sm text-muted mt-0.5">{pb.description}</p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {pb.actions.map((action) => (
                          <span key={action} className="text-xs px-2 py-1 rounded-lg bg-surface2 border border-border text-muted">{action}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {allCompleted && (
                    <span className="text-xs px-2 py-1 rounded-full bg-accent-green/10 text-accent-green font-medium">Completed</span>
                  )}
                </div>
              </div>

              {/* Steps (expanded) */}
              {state.expanded && (
                <div className="px-6 pb-6 border-t border-border pt-4 space-y-4 fade-in">
                  {/* Progress Stepper */}
                  <div className="flex items-center justify-between">
                    {state.steps.map((step, i) => (
                      <div key={step.name} className="flex items-center flex-1">
                        <div className="flex flex-col items-center">
                          {getStepIcon(step.status)}
                          <span className={`text-[10px] mt-1 font-medium ${step.status === "completed" ? "text-accent-green" : step.status === "running" ? "text-accent-blue" : "text-muted"}`}>
                            {step.name}
                          </span>
                        </div>
                        {i < state.steps.length - 1 && (
                          <div className={`flex-1 h-0.5 mx-2 mt-[-12px] rounded-full ${step.status === "completed" ? "bg-accent-green" : "bg-border"} transition-colors duration-500`} />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Step Details */}
                  <div className="space-y-2">
                    {state.steps.map((step) => (
                      <div key={step.name} className={`flex items-start gap-3 p-3 rounded-lg transition-all ${step.status === "running" ? "bg-accent-blue/5 border border-accent-blue/20" : step.status === "completed" ? "bg-accent-green/5 border border-accent-green/20" : "bg-surface2 border border-transparent"}`}>
                        {getStepIcon(step.status)}
                        <div>
                          <p className="text-sm font-medium text-text">{step.name}</p>
                          <p className="text-xs text-muted">{step.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => runPlaybook(pb.id)}
                      disabled={anyRunning}
                      className="flex-1 py-2.5 bg-accent-green/10 text-accent-green font-medium rounded-xl hover:bg-accent-green/20 transition-all border border-accent-green/30 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                    >
                      <Play className="h-4 w-4" /> {allCompleted ? "Run Again" : "Execute"}
                    </button>
                    {(allCompleted || state.steps.some((s) => s.status !== "pending")) && (
                      <button
                        onClick={() => resetPlaybook(pb.id)}
                        disabled={anyRunning}
                        className="py-2.5 px-4 text-muted font-medium rounded-xl hover:text-text hover:bg-surface2 transition-all border border-border disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                      >
                        <RotateCw className="h-4 w-4" /> Reset
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
