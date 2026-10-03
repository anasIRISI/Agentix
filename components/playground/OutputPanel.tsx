"use client";
import { Copy, CheckCheck, Loader2, Download, Code, Eye } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { PlaygroundRunResult } from "@/lib/hooks/useRuns";
import { toast } from "sonner";

interface Props {
  result: PlaygroundRunResult | null;
  isLoading: boolean;
  format: "json" | "text" | "markdown";
}

export function OutputPanel({ result, isLoading, format }: Props) {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"pretty" | "raw">("pretty");

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card/60 backdrop-blur-sm min-h-[420px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="relative">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">Executing Agent…</p>
            <p className="text-xs text-muted-foreground mt-0.5">Streaming thoughts & tools through Gemini engine</p>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="rounded-xl border border-dashed bg-card/30 min-h-[420px] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center mb-3">
          <Code className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">Ready for execution</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
          Fill the inputs on the left and click <span className="font-semibold text-primary">Run</span> (or press <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono border">⌘↵</kbd>).
        </p>
      </div>
    );
  }

  if (result.error && !result.output) {
    return (
      <div className="rounded-xl border border-destructive/50 bg-destructive/5 p-5 min-h-[220px]">
        <p className="text-sm font-semibold text-destructive mb-2 flex items-center gap-2">
          Run Failed
        </p>
        <pre className="text-xs text-destructive/90 whitespace-pre-wrap font-mono p-3 rounded-lg bg-destructive/10 border border-destructive/20">{result.error}</pre>
        <ErrorHint error={result.error} />
      </div>
    );
  }

  const isJson = format === "json";
  const formattedJson = isJson ? JSON.stringify(result.output, null, 2) : "";
  const rawString = String(result.output ?? "");
  const displayText = isJson ? formattedJson : rawString;

  function handleCopy() {
    navigator.clipboard.writeText(displayText).then(() => {
      setCopied(true);
      toast.success("Output copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleDownload() {
    const blob = new Blob([displayText], { type: isJson ? "application/json" : "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agent-output-${Date.now()}.${isJson ? "json" : "txt"}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Output downloaded");
  }

  return (
    <div className="rounded-xl border bg-card/60 backdrop-blur-sm min-h-[420px] flex flex-col shadow-xs overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b bg-muted/40">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {format} output
          </span>
          {result.valid === true && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              ✓ Valid Schema
            </span>
          )}
          {result.valid === false && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-destructive/15 text-destructive border border-destructive/30">
              ✗ Invalid Schema
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {isJson && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs px-2 text-muted-foreground"
              onClick={() => setViewMode((m) => (m === "pretty" ? "raw" : "pretty"))}
            >
              <Eye className="w-3 h-3 mr-1" />
              {viewMode === "pretty" ? "Raw" : "Pretty"}
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleDownload} title="Download file">
            <Download className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy} title="Copy to clipboard">
            {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4 bg-zinc-950/40 dark:bg-zinc-950/60">
        <pre className="text-xs font-mono whitespace-pre-wrap break-all leading-relaxed text-foreground/90 select-text">
          {viewMode === "raw" && isJson ? JSON.stringify(result.output) : displayText}
        </pre>
      </ScrollArea>
    </div>
  );
}

function ErrorHint({ error }: { error: string }) {
  const lower = error.toLowerCase();
  let hint = "";
  if (lower.includes("quota") || lower.includes("429") || lower.includes("rate limit") || lower.includes("resource exhausted")) {
    hint = "You've hit Gemini's free-tier rate limit. Wait a moment and retry, or check your API quota in Google AI Studio.";
  } else if (lower.includes("api key") || lower.includes("missing")) {
    hint = "Verify your GOOGLE_GENERATIVE_AI_API_KEY in .env.local.";
  } else if (lower.includes("timeout")) {
    hint = "The run timed out. You can increase timeoutMs in the Advanced tab.";
  } else if (lower.includes("json")) {
    hint = "Output could not be parsed as JSON. Enable Strict validation with repair retries in the Output tab.";
  }
  if (!hint) return null;
  return (
    <div className="mt-3 p-3 rounded-lg bg-muted border text-xs text-muted-foreground">
      <span className="font-semibold text-foreground">💡 Tip:</span> {hint}
    </div>
  );
}

