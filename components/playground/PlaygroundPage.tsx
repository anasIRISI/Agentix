"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Play, Loader2, Edit, Terminal, Sparkles, ShieldCheck, Activity, BarChart2,
  Sliders
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { InputForm } from "./InputForm";
import { OutputPanel } from "./OutputPanel";
import { RunHistory } from "./RunHistory";
import { TracePanel } from "./TracePanel";
import { MetricsPanel } from "./MetricsPanel";
import { ApiSnippetsDialog } from "@/components/dashboard/ApiSnippetsDialog";
import { useAgent } from "@/lib/hooks/useAgents";
import { usePlaygroundRun, useRuns, type PlaygroundRunResult } from "@/lib/hooks/useRuns";
import { toast } from "sonner";

export function PlaygroundPage({ agentId }: { agentId: string }) {
  const router = useRouter();
  const { data: agent, isLoading } = useAgent(agentId);
  const { data: runs, refetch: refetchRuns } = useRuns(agentId);
  const runMutation = usePlaygroundRun();

  const [input, setInput] = useState<Record<string, unknown>>({});
  const [rawInput, setRawInput] = useState("");
  const [useRawInput, setUseRawInput] = useState(false);
  const [result, setResult] = useState<PlaygroundRunResult | null>(null);
  const [outputTab, setOutputTab] = useState("output");
  const [snippetsOpen, setSnippetsOpen] = useState(false);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleRun();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  async function handleRun() {
    let payload: Record<string, unknown>;
    if (useRawInput) {
      try {
        payload = JSON.parse(rawInput || "{}");
      } catch {
        toast.error("Invalid JSON input");
        return;
      }
    } else {
      payload = input;
    }

    try {
      const res = await runMutation.mutateAsync({ agentId, input: payload });
      setResult(res);
      setOutputTab("output");
      refetchRuns();
      toast.success("Execution completed!");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Run failed";
      toast.error(msg);
    }
  }

  function handleRerun(runInput: Record<string, unknown>) {
    setInput(runInput);
    setRawInput(JSON.stringify(runInput, null, 2));
  }

  if (isLoading) {
    return (
      <div className="min-h-screen p-8 space-y-4">
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (!agent) {
    return <div className="p-8 text-muted-foreground">Agent not found.</div>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-card/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => router.push("/")}
              title="Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <span className="font-bold text-base tracking-tight">{agent.name}</span>
              <span className="ml-2 text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {agent.config.model}
              </span>
            </div>
            <Badge
              variant={agent.status === "active" ? "default" : "secondary"}
              className={agent.status === "active" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[11px]" : "text-[11px]"}
            >
              {agent.status}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => setSnippetsOpen(true)}
              title="View API Code"
            >
              <Terminal className="w-3.5 h-3.5 text-primary" />
              API Code
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => router.push(`/agents/${agentId}/edit`)}
            >
              <Edit className="w-3.5 h-3.5" />
              Edit
            </Button>
            <Button
              size="sm"
              onClick={handleRun}
              disabled={runMutation.isPending}
              className="gap-1.5 shadow-md shadow-primary/20 font-semibold"
            >
              {runMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Running…
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-primary-foreground" />
                  Run <kbd className="ml-1 text-[10px] opacity-70 bg-primary-foreground/20 px-1 py-0.5 rounded">⌘↵</kbd>
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex-1 flex flex-col md:flex-row gap-6">
        {/* Left panel — inputs */}
        <div className="w-full md:w-80 shrink-0 space-y-4">
          <div className="p-4 rounded-xl border bg-card/60 backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-primary" /> Input Values
              </span>
              <button
                className="text-xs text-primary font-medium hover:underline transition-colors"
                onClick={() => setUseRawInput(!useRawInput)}
              >
                {useRawInput ? "Form view" : "Raw JSON"}
              </button>
            </div>

            {useRawInput ? (
              <textarea
                className="w-full h-64 rounded-lg border bg-background/80 p-3 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                placeholder="{}"
                aria-label="Raw JSON input"
              />
            ) : (
              <InputForm params={agent.config.inputParams || []} values={input} onChange={setInput} />
            )}
          </div>

          <RunHistory
            runs={runs || []}
            onRerun={handleRerun}
            currentInput={input}
          />
        </div>

        {/* Right panel — output */}
        <div className="flex-1 min-w-0">
          <Tabs value={outputTab} onValueChange={setOutputTab}>
            <TabsList className="bg-muted/70 p-1 rounded-xl border gap-1">
              <TabsTrigger value="output" className="rounded-lg text-xs gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Output
              </TabsTrigger>
              <TabsTrigger value="validation" className="rounded-lg text-xs gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Validation
              </TabsTrigger>
              <TabsTrigger value="trace" className="rounded-lg text-xs gap-1.5">
                <Activity className="w-3.5 h-3.5" /> Trace
              </TabsTrigger>
              <TabsTrigger value="metrics" className="rounded-lg text-xs gap-1.5">
                <BarChart2 className="w-3.5 h-3.5" /> Metrics
              </TabsTrigger>
            </TabsList>

            <div className="mt-4">
              <TabsContent value="output">
                <OutputPanel result={result} isLoading={runMutation.isPending} format={agent.config.outputFormat} />
              </TabsContent>
              <TabsContent value="validation">
                <ValidationPanel result={result} />
              </TabsContent>
              <TabsContent value="trace">
                <TracePanel result={result} />
              </TabsContent>
              <TabsContent value="metrics">
                <MetricsPanel result={result} model={agent.config.model} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      <ApiSnippetsDialog
        agent={agent}
        open={snippetsOpen}
        onClose={() => setSnippetsOpen(false)}
      />
    </div>
  );
}

function ValidationPanel({ result }: { result: PlaygroundRunResult | null }) {
  if (!result) return <EmptyOutput label="Run the agent to see validation results." />;
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${result.valid ? "bg-green-500" : "bg-red-500"}`} />
        <span className="font-medium text-sm">{result.valid ? "Valid output" : "Validation failed"}</span>
      </div>
      {result.error && (
        <div className="rounded-md bg-destructive/10 text-destructive text-sm p-3">
          {result.error}
        </div>
      )}
    </div>
  );
}

function EmptyOutput({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed p-12 text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}
