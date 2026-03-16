"use client";

import { useState, useCallback, useEffect } from "react";
import { AlertTriangle, CheckCircle, Play, RotateCw, Loader2 } from "lucide-react";
import { generateNewThreat, type Threat, type Playbook } from "@/lib/mock-data";
import { fetchPlaybooks, executePlaybook } from "@/lib/api-client";

interface PlaybookStepState {
  name: string;
  description: string;
  status: "pending" | "running" | "completed";
}

interface PlaybookState {
  steps: PlaybookStepState[];
  expanded: boolean;
}

export default function PlaybooksPage() {
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [playbookStates, setPlaybookStates] = useState<Record<string, PlaybookState>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [simulating, setSimulating] = useState(false);
  const [simulatedThreat, setSimulatedThreat] = useState<Threat | null>(null);
  const [simulatingPlaybookId, setSimulatingPlaybookId] = useState<string | null>(null);

  useEffect(() => {
    async function loadPlaybooks() {
      try {
        setLoading(true);
        const data = await fetchPlaybooks();
        setPlaybooks(data);
        
        const initial: Record<string, PlaybookState> = {};
        data.forEach((pb: any) => {
          const steps = (pb.steps || []).map((s: any) => {
            // Handle if the step is just a string (common in some API versions)
            if (typeof s === "string") {
              return { name: s, description: "", status: "pending" as const };
            }
            // Handle if it is an object with varying field names
            return {
              name: s.name || s.Name || s.label || s.title || s.text || s.step || s.action || "Unknown Step",
              description: s.description || s.Description || s.detail || s.summary || "",
              status: "pending" as const 
            };
          });
          initial[pb.id] = { steps, expanded: false };
        });
        setPlaybookStates(initial);
      } catch (err) {
        console.error("Failed to load playbooks:", err);
        setError("Could not connect to the Threat Management Platform API.");
      } finally {
        setLoading(false);
      }
    }
    loadPlaybooks();
  }, []);

  const toggleExpand = (id: string) => {
    setPlaybookStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], expanded: !prev[id].expanded },
    }));
  };

  const runPlaybook = useCallback(async (id: string) => {
    const state = playbookStates[id];
    if (!state) return;

    // Reset steps
    setPlaybookStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], expanded: true, steps: (prev[id].steps || []).map((s) => ({ ...s, status: "pending" as const })) },
    }));

    // If we have a simulated threat, execute on backend
    if (simulatedThreat) {
      try {
        await executePlaybook(id, simulatedThreat.id);
      } catch (err) {
        console.error("Execution failed:", err);
      }
    }

    // Animate steps for visual feedback
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
  }, [playbookStates, simulatedThreat]);

  const resetPlaybook = (id: string) => {
    setPlaybookStates((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        steps: (prev[id]?.steps || []).map((s) => ({ ...s, status: "pending" as const })),
      },
    }));
  };

  const simulateAttack = () => {
    setSimulating(true);
    const threat = generateNewThreat();
    setSimulatedThreat(threat);

    // Pick a random playbook
    if (playbooks.length > 0) {
      const pbIndex = Math.floor(Math.random() * playbooks.length);
      const pbId = playbooks[pbIndex].id;
      setSimulatingPlaybookId(pbId);

      // Auto-expand and run that playbook after a delay
      setTimeout(() => {
        setSimulating(false);
        runPlaybook(pbId);
      }, 2000);
    }
  };

  const getStepIcon = (status: string) => {
    if (status === "completed") return <CheckCircle className="h-5 w-5 text-accent-green" />;
    if (status === "running") return <Loader2 className="h-5 w-5 text-accent-blue animate-spin" />;
    return <div className="w-5 h-5 rounded-full border-2 border-border" />;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-10 w-10 text-accent-green animate-spin" />
        <p className="text-muted">Loading playbooks from Platform API...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-accent-red/5 border border-accent-red/30 rounded-xl p-8 flex flex-col items-center text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-accent-red" />
        <div>
          <h2 className="text-xl font-bold text-text">Connection Error</h2>
          <p className="text-muted mt-2">{error}</p>
          <p className="text-xs text-muted mt-4">Platform API URL: http://11.12.6.240:8000</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-accent-red text-white rounded-lg font-medium hover:bg-accent-red/90 transition-all font-display"
        >
          Retry Connection
        </button>
      </div>
    );
  }

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
                        {pb.actions?.map((action, i) => (
                          <span key={`${action}-${i}`} className="text-xs px-2 py-1 rounded-lg bg-surface2 border border-border text-muted">{action}</span>
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
                    {state.steps?.map((step, i) => (
                      <div key={`${step.name}-${i}`} className="flex items-center flex-1">
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
                    {state.steps?.map((step: any, i) => (
                      <div key={`detail-${step.name}-${i}`} className={`flex items-start gap-3 p-3 rounded-lg transition-all ${step.status === "running" ? "bg-accent-blue/5 border border-accent-blue/20" : step.status === "completed" ? "bg-accent-green/5 border border-accent-green/20" : "bg-surface2 border border-transparent"}`}>
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

