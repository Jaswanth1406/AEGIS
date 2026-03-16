/**
 * AEGIS Platform Backend API Client
 * Connects the Next.js frontend to the external Threat Management Platform API.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_PLATFORM_API_URL || "http://11.12.6.240:8000";

// Helper to get auth token (mocked for now since Next.js uses Better Auth)
// If the backend requires a strict token, this can be synced later.
const getHeaders = () => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${typeof window !== "undefined" ? localStorage.getItem("platform_token") || "demo-token" : "demo-token"}`,
});

export const fetchDashboardStats = async () => {
  const res = await fetch(`${API_BASE_URL}/api/dashboard/stats`, { headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
};

export const fetchThreats = async (page = 1, limit = 20, severity?: string, search?: string) => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (severity) params.append("severity", severity);
  if (search) params.append("search", search);

  const res = await fetch(`${API_BASE_URL}/api/threats?${params.toString()}`, { headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to fetch threats");
  return res.json();
};

export const fetchGlobalAttacks = async () => {
  const res = await fetch(`${API_BASE_URL}/api/attacks/global`, { headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to fetch attack map");
  return res.json();
};

export const fetchPlaybooks = async () => {
  const res = await fetch(`${API_BASE_URL}/api/playbooks`, { headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to fetch playbooks");
  return res.json();
};

export const executePlaybook = async (playbookId: string | number, threatId: string | number) => {
  const res = await fetch(`${API_BASE_URL}/api/playbooks/${playbookId}/execute`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ threat_id: threatId }),
  });
  if (!res.ok) throw new Error("Failed to execute playbook");
  return res.json();
};

export const fetchThreatById = async (threatId: string | number) => {
  const res = await fetch(`${API_BASE_URL}/api/threats/${threatId}`, { headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to fetch threat details");
  return res.json();
};
