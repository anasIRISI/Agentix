"use client";
import type { PlaygroundRunResult } from "@/lib/hooks/useRuns";
import { Coins, Zap, Clock, ShieldCheck, Database } from "lucide-react";

interface Props {
  result: PlaygroundRunResult | null;
  model: string;
}

function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  highlight,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ElementType;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-4 bg-card/60 backdrop-blur-sm transition-all ${highlight ? "border-primary/40 shadow-xs" : ""}`}>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {Icon && <Icon className="w-4 h-4 text-muted-foreground/70" />}
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

export function MetricsPanel({ result, model }: Props) {
  if (!result) {
    return (
      <div className="rounded-xl border border-dashed min-h-[300px] flex items-center justify-center">
        <p className="text-sm text-muted-foreground">No execution metrics yet. Run the agent first.</p>
      </div>
    );
  }

  const { usage, llmRequestCount, durationMs } = result;
  const promptTokens = usage?.promptTokens || 0;
  const completionTokens = usage?.completionTokens || 0;
  const totalTokens = usage?.totalTokens || promptTokens + completionTokens;

  // Gemini pricing estimate (~$0.075 / 1M input tokens, ~$0.30 / 1M output tokens for Flash)
  const estimatedCost = (promptTokens * 0.000000075) + (completionTokens * 0.0000003);
  const costDisplay = estimatedCost > 0 ? `$${estimatedCost.toFixed(6)}` : "$0.00 (Free Tier)";

  const promptPct = totalTokens > 0 ? Math.round((promptTokens / totalTokens) * 100) : 50;
  const completionPct = 100 - promptPct;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          label="LLM Calls"
          value={llmRequestCount}
          sub="queue requests"
          icon={Zap}
        />
        <MetricCard
          label="Latency"
          value={durationMs ? `${(durationMs / 1000).toFixed(2)}s` : "—"}
          sub="wall clock"
          icon={Clock}
        />
        <MetricCard
          label="Total Tokens"
          value={totalTokens.toLocaleString()}
          sub={`${promptTokens} in / ${completionTokens} out`}
          icon={Database}
          highlight
        />
        <MetricCard
          label="Est. Cost"
          value={costDisplay}
          sub="pay-as-you-go"
          icon={Coins}
        />
      </div>

      {/* Token usage distribution visual bar */}
      {totalTokens > 0 && (
        <div className="rounded-xl border p-4 bg-card/60 backdrop-blur-sm space-y-2">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-primary flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary" /> Input Tokens: {promptTokens} ({promptPct}%)
            </span>
            <span className="text-purple-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-400" /> Output Tokens: {completionTokens} ({completionPct}%)
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden flex">
            <div style={{ width: `${promptPct}%` }} className="bg-primary h-full transition-all duration-500" />
            <div style={{ width: `${completionPct}%` }} className="bg-purple-400 h-full transition-all duration-500" />
          </div>
        </div>
      )}

      <div className="rounded-xl border p-4 space-y-2.5 text-sm bg-card/60 backdrop-blur-sm">
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground">Model Engine</span>
          <span className="font-mono px-2 py-0.5 rounded bg-muted/80 border">{model}</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground">Validation Status</span>
          <span className={result.valid ? "text-emerald-500 font-semibold flex items-center gap-1" : result.error ? "text-destructive font-semibold" : "text-muted-foreground"}>
            {result.valid ? <><ShieldCheck className="w-3.5 h-3.5" /> Schema Validated</> : result.error ? "Failed" : "Unvalidated"}
          </span>
        </div>
      </div>
    </div>
  );
}

