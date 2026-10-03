"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Check, Copy, Terminal, Code2, Sparkles } from "lucide-react";
import type { Agent } from "@/lib/schemas/agent";
import { toast } from "sonner";

interface Props {
  agent: Agent | null;
  open: boolean;
  onClose: () => void;
}

export function ApiSnippetsDialog({ agent, open, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  if (!agent) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const endpoint = `${origin}/api/agents/${agent.id}/run`;

  // Sample payload from agent input params
  const samplePayload: Record<string, unknown> = {};
  if (agent.config.inputParams && agent.config.inputParams.length > 0) {
    for (const p of agent.config.inputParams) {
      if (p.type === "number") samplePayload[p.name] = 42;
      else if (p.type === "boolean") samplePayload[p.name] = true;
      else if (p.type === "json") samplePayload[p.name] = { key: "value" };
      else samplePayload[p.name] = p.default || `Sample ${p.name}`;
    }
  } else {
    samplePayload["message"] = "Hello, analyze this!";
  }

  const jsonPayloadString = JSON.stringify({ input: samplePayload }, null, 2);

  const curlSnippet = `curl -X POST "${endpoint}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_AGENT_API_KEY" \\
  -d '${JSON.stringify({ input: samplePayload })}'`;

  const pythonSnippet = `import requests

url = "${endpoint}"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_AGENT_API_KEY"
}
payload = {
    "input": ${JSON.stringify(samplePayload, null, 4)}
}

response = requests.post(url, json=payload, headers=headers)
print("Response status:", response.status_code)
print(response.json())`;

  const tsSnippet = `async function runAgent() {
  const response = await fetch("${endpoint}", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer YOUR_AGENT_API_KEY",
    },
    body: JSON.stringify({
      input: ${JSON.stringify(samplePayload, null, 6).trim()}
    }),
  });

  const data = await response.json();
  console.log("Agent Output:", data);
  return data;
}

runAgent().catch(console.error);`;

  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Code snippet copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-lg">Run {agent.name} via API</DialogTitle>
              <DialogDescription className="text-xs">
                Integrate this agent directly into your backend, frontend, or automation scripts.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="rounded-lg bg-muted/60 p-3 text-xs flex items-center justify-between border">
            <span className="font-mono text-muted-foreground truncate">{endpoint}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/15 text-primary">POST</span>
          </div>

          <Tabs defaultValue="curl" className="w-full">
            <div className="flex items-center justify-between mb-2">
              <TabsList className="grid grid-cols-3 w-64">
                <TabsTrigger value="curl">cURL</TabsTrigger>
                <TabsTrigger value="python">Python</TabsTrigger>
                <TabsTrigger value="typescript">TypeScript</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="curl" className="relative mt-0">
              <pre className="p-4 rounded-lg bg-zinc-950 text-zinc-100 font-mono text-xs overflow-x-auto leading-relaxed border border-zinc-800">
                {curlSnippet}
              </pre>
              <Button
                size="sm"
                variant="secondary"
                className="absolute top-2 right-2 h-7 gap-1 text-xs"
                onClick={() => copyToClipboard(curlSnippet)}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </TabsContent>

            <TabsContent value="python" className="relative mt-0">
              <pre className="p-4 rounded-lg bg-zinc-950 text-zinc-100 font-mono text-xs overflow-x-auto leading-relaxed border border-zinc-800">
                {pythonSnippet}
              </pre>
              <Button
                size="sm"
                variant="secondary"
                className="absolute top-2 right-2 h-7 gap-1 text-xs"
                onClick={() => copyToClipboard(pythonSnippet)}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </TabsContent>

            <TabsContent value="typescript" className="relative mt-0">
              <pre className="p-4 rounded-lg bg-zinc-950 text-zinc-100 font-mono text-xs overflow-x-auto leading-relaxed border border-zinc-800">
                {tsSnippet}
              </pre>
              <Button
                size="sm"
                variant="secondary"
                className="absolute top-2 right-2 h-7 gap-1 text-xs"
                onClick={() => copyToClipboard(tsSnippet)}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </TabsContent>
          </Tabs>

          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs space-y-1">
            <p className="font-semibold text-primary flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Authentication note
            </p>
            <p className="text-muted-foreground">
              If an API Key is generated for this agent (in the agent editor), pass it in the <code className="bg-background px-1 rounded">Authorization: Bearer &lt;key&gt;</code> header.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
