/**
 * VAPI API client
 */

const VAPI_BASE = "https://api.vapi.ai";

function getVapiKey(): string {
  const key = process.env["VAPI_API_KEY"];
  if (!key) throw new Error("VAPI_API_KEY environment variable is not set");
  return key;
}

async function vapiGet<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const url = new URL(`${VAPI_BASE}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }
  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${getVapiKey()}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`VAPI API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

interface VapiCustomer {
  name?: string;
  number?: string;
  email?: string;
}

interface VapiAnalysis {
  summary?: string;
  structuredData?: Record<string, unknown>;
  successEvaluation?: string;
}

interface VapiMessage {
  role: string;
  message?: string;
  time?: number;
  endTime?: number;
  duration?: number;
}

interface VapiCall {
  id: string;
  status: string;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  endedReason?: string;
  assistantId?: string;
  customer?: VapiCustomer;
  transcript?: string;
  recordingUrl?: string;
  stereoRecordingUrl?: string;
  analysis?: VapiAnalysis;
  messages?: VapiMessage[];
  cost?: number;
}

function calcDuration(call: VapiCall): number | null {
  if (call.startedAt && call.endedAt) {
    return Math.round((new Date(call.endedAt).getTime() - new Date(call.startedAt).getTime()) / 1000);
  }
  return null;
}

function extractLeadInfo(call: VapiCall) {
  const sd = call.analysis?.structuredData ?? {};
  return {
    name: call.customer?.name ?? (sd["name"] as string | undefined) ?? null,
    phone: call.customer?.number ?? null,
    email: call.customer?.email ?? (sd["email"] as string | undefined) ?? null,
    propertyType: (sd["propertyType"] as string | undefined) ?? (sd["property_type"] as string | undefined) ?? null,
    budget: (sd["budget"] as string | undefined) ?? null,
    location: (sd["location"] as string | undefined) ?? (sd["area"] as string | undefined) ?? null,
    bedrooms: (sd["bedrooms"] as string | undefined) ?? (sd["bedroomCount"] as string | undefined) ?? null,
  };
}

function extractSentiment(call: VapiCall) {
  const evaluation = call.analysis?.successEvaluation;
  const score = evaluation ? parseFloat(evaluation) : null;
  const numericScore = score !== null && !isNaN(score) ? score : null;

  let label: string | null = null;
  let intent: string | null = null;

  if (numericScore !== null) {
    if (numericScore >= 0.7) label = "positive";
    else if (numericScore >= 0.4) label = "neutral";
    else label = "negative";
  } else if (evaluation) {
    const ev = evaluation.toLowerCase();
    if (ev.includes("success") || ev.includes("positive") || ev.includes("interested")) label = "positive";
    else if (ev.includes("fail") || ev.includes("negative") || ev.includes("not interested")) label = "negative";
    else label = "neutral";
  }

  const summary = (call.analysis?.summary ?? "").toLowerCase();
  if (summary.includes("buy") || summary.includes("purchas")) intent = "buyer";
  else if (summary.includes("rent") || summary.includes("lease")) intent = "renter";
  else if (summary.includes("sell") || summary.includes("list")) intent = "seller";
  else if (summary.includes("invest")) intent = "investor";

  return { score: numericScore, label, intent };
}

function extractFollowUpActions(call: VapiCall): string[] {
  const sd = call.analysis?.structuredData ?? {};
  const actions = sd["followUpActions"] ?? sd["follow_up_actions"] ?? sd["nextSteps"] ?? sd["next_steps"];
  if (Array.isArray(actions)) return actions.map(String);

  const summary = call.analysis?.summary ?? "";
  const actions2: string[] = [];
  const lc = summary.toLowerCase();
  if (lc.includes("schedule") || lc.includes("appointment") || lc.includes("meeting")) actions2.push("Schedule a property viewing");
  if (lc.includes("send") && (lc.includes("listing") || lc.includes("brochure") || lc.includes("detail"))) actions2.push("Send property listings");
  if (lc.includes("callback") || lc.includes("call back") || lc.includes("follow up") || lc.includes("follow-up")) actions2.push("Schedule a follow-up call");
  if (lc.includes("pre-approv") || lc.includes("preapprov") || lc.includes("mortgage")) actions2.push("Assist with mortgage pre-approval");
  return actions2;
}

function mapToCallSummary(call: VapiCall) {
  return {
    id: call.id,
    status: call.status,
    createdAt: call.createdAt,
    startedAt: call.startedAt ?? null,
    endedAt: call.endedAt ?? null,
    durationSeconds: calcDuration(call),
    endedReason: call.endedReason ?? null,
    customerName: call.customer?.name ?? (call.analysis?.structuredData?.["name"] as string) ?? null,
    customerPhone: call.customer?.number ?? (call.analysis?.structuredData?.["phone"] as string) ?? null,
    summary: call.analysis?.summary ?? null,
    sentiment: extractSentiment(call),
    lead: extractLeadInfo(call),
    hasRecording: !!(call.recordingUrl || call.stereoRecordingUrl),
    assistantId: call.assistantId ?? null,
  };
}

function mapToCallDetail(call: VapiCall) {
  return {
    ...mapToCallSummary(call),
    transcript: call.transcript ?? null,
    recordingUrl: call.recordingUrl ?? null,
    stereoRecordingUrl: call.stereoRecordingUrl ?? null,
    followUpActions: extractFollowUpActions(call),
    messages: (call.messages ?? []).map((m) => ({
      role: m.role,
      message: m.message ?? null,
      time: m.time ?? null,
      endTime: m.endTime ?? null,
      duration: m.duration ?? null,
    })),
    cost: call.cost ?? null,
  };
}

export async function listVapiCalls(opts: {
  limit?: number;
  createdAtGt?: string;
  status?: string;
  assistantId?: string;
}) {
  const calls = await vapiGet<VapiCall[]>("/call", {
    limit: opts.limit ?? 50,
    createdAtGt: opts.createdAtGt,
    status: opts.status,
    assistantId: opts.assistantId,
  });
  return calls.map(mapToCallSummary);
}

export async function getVapiCall(id: string) {
  const call = await vapiGet<VapiCall>(`/call/${id}`);
  return mapToCallDetail(call);
}

export async function getVapiCallStats(assistantId?: string) {
  const calls = await vapiGet<VapiCall[]>("/call", {
    limit: 500,
    assistantId,
  });

  const total = calls.length;
  const answered = calls.filter((c) => c.status === "ended" || c.startedAt).length;

  const durations = calls.map(calcDuration).filter((d): d is number => d !== null);
  const avgDuration = durations.length > 0
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : null;

  let positive = 0, neutral = 0, negative = 0;
  const intentCounts: Record<string, number> = {};
  for (const call of calls) {
    const s = extractSentiment(call);
    if (s.label === "positive") positive++;
    else if (s.label === "negative") negative++;
    else neutral++;
    if (s.intent) intentCounts[s.intent] = (intentCounts[s.intent] ?? 0) + 1;
  }

  const dayMap: Record<string, number> = {};
  const now = Date.now();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    dayMap[d.toISOString().slice(0, 10)] = 0;
  }
  for (const call of calls) {
    const day = call.createdAt.slice(0, 10);
    if (day in dayMap) dayMap[day]++;
  }
  const callsByDay = Object.entries(dayMap).map(([date, count]) => ({ date, count }));

  const weekAgo = now - 7 * 86400000;
  const twoWeeksAgo = now - 14 * 86400000;
  const thisWeek = calls.filter((c) => new Date(c.createdAt).getTime() >= weekAgo).length;
  const lastWeek = calls.filter((c) => {
    const t = new Date(c.createdAt).getTime();
    return t >= twoWeeksAgo && t < weekAgo;
  }).length;

  const topIntents = Object.entries(intentCounts).sort(([, a], [, b]) => b - a).slice(0, 5).map(([intent]) => intent);

  return {
    totalCalls: total,
    answeredCalls: answered,
    avgDurationSeconds: avgDuration,
    sentimentBreakdown: { positive, neutral, negative },
    callsByDay,
    topIntents,
    callsThisWeek: thisWeek,
    callsLastWeek: lastWeek,
  };
}
