"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Save, Play, ArrowLeft, AlertCircle, Loader2, History, Terminal,
  Sliders, Sparkles, FileText, Code2, Database, Globe, Wrench, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { GeneralTab } from "./tabs/GeneralTab";
import { PromptTab } from "./tabs/PromptTab";
import { InputTab } from "./tabs/InputTab";
import { OutputTab } from "./tabs/OutputTab";
import { ResourcesTab } from "./tabs/ResourcesTab";
import { AdvancedTab } from "./tabs/AdvancedTab";
import { CustomToolTab } from "./tabs/CustomToolTab";
import { ExternalApisTab } from "./tabs/ExternalApisTab";
import { VersionHistoryDrawer } from "./VersionHistoryDrawer";
import { ApiSnippetsDialog } from "@/components/dashboard/ApiSnippetsDialog";
import { useAgent, useCreateAgent, useUpdateAgent } from "@/lib/hooks/useAgents";
import type { AgentConfig, CustomTool, ExternalApi } from "@/lib/schemas/agent";
import { toast } from "sonner";

const DRAFT_KEY = (id: string) => `agentforge:draft:${id}`;

interface AgentFormState {
  name: string;
  description: string;
  status: "draft" | "active";
  config: AgentConfig;
  customTool: CustomTool | null;
  externalApis: ExternalApi[];
}

const DEFAULT_CONFIG: AgentConfig = {
  model: "gemini-3.8-flash",
  temperature: 0.7,
  maxTokens: 2048,
  systemPrompt: "",
  inputParams: [],
  outputFormat: "json",
  outputSchema: "{}",
  strictValidation: false,
  maxIterations: 3,
  repairRetries: 1,
  timeoutMs: 30000,
};

export function AgentEditorPage({ agentId }: { agentId?: string }) {
  const router = useRouter();
  const { data: existingAgent, isLoading } = useAgent(agentId ?? "");
  const createAgent = useCreateAgent();
  const updateAgent = useUpdateAgent();

  const [form, setForm] = useState<AgentFormState>({
    name: "Untitled Agent",
    description: "",
    status: "draft",
    config: DEFAULT_CONFIG,
    customTool: null,
    externalApis: [],
  });
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [versionDrawerOpen, setVersionDrawerOpen] = useState(false);
  const [apiSnippetsOpen, setApiSnippetsOpen] = useState(false);
  const draftId = agentId ?? "__new__";
  const initialized = useRef(false);

  // Load existing agent or draft
  useEffect(() => {
    if (initialized.current) return;
    // Try local draft first
    const draftStr = localStorage.getItem(DRAFT_KEY(draftId));
    if (draftStr) {
      try {
        const draft = JSON.parse(draftStr) as AgentFormState;
        setForm(draft);
        setHasUnsaved(true);
        initialized.current = true;
        return;
      } catch { /* ignore */ }
    }
    if (existingAgent) {
      setForm({
        name: existingAgent.name,
        description: existingAgent.description,
        status: existingAgent.status,
        config: existingAgent.config,
        customTool: existingAgent.customTool,
        externalApis: existingAgent.externalApis,
      });
      initialized.current = true;
    } else if (!agentId) {
      initialized.current = true;
    }
  }, [existingAgent, agentId, draftId]);

  // Autosave draft to localStorage only (no LLM call)
  const saveDraft = useCallback((state: AgentFormState) => {
    try {
      localStorage.setItem(DRAFT_KEY(draftId), JSON.stringify(state));
    } catch { /* ignore */ }
  }, [draftId]);

  function updateForm(partial: Partial<AgentFormState>) {
    setForm((prev) => {
      const next = { ...prev, ...partial };
      setHasUnsaved(true);
      saveDraft(next);
      return next;
    });
  }

  function updateConfig(partial: Partial<AgentConfig>) {
    updateForm({ config: { ...form.config, ...partial } });
  }

  // Warn on navigation with unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsaved) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsaved]);

  // Keyboard save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("Agent name is required");
      setActiveTab("general");
      return;
    }
    setIsSaving(true);
    try {
      if (agentId) {
        await updateAgent.mutateAsync({ id: agentId, data: form });
      } else {
        const agent = await createAgent.mutateAsync(form);
        localStorage.removeItem(DRAFT_KEY("__new__"));
        router.replace(`/agents/${agent.id}/edit`);
      }
      localStorage.removeItem(DRAFT_KEY(draftId));
      setHasUnsaved(false);
    } finally {
      setIsSaving(false);
    }
  }

  if (agentId && isLoading && !initialized.current) {
    return (
      <div className="min-h-screen p-8 space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sticky header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push("/")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <input
            value={form.name}
            onChange={(e) => updateForm({ name: e.target.value })}
            className="text-lg font-semibold bg-transparent border-none outline-none focus:ring-0 flex-1 min-w-0"
            placeholder="Agent name"
            aria-label="Agent name"
          />
          {hasUnsaved && (
            <Badge variant="secondary" className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
              <AlertCircle className="w-3 h-3 mr-1" />
              Unsaved
            </Badge>
          )}
          <ThemeToggle />
          {agentId && (
            <Button
              variant="outline"
              size="sm"
              className="hidden md:flex gap-1.5 text-xs"
              onClick={() => setApiSnippetsOpen(true)}
              title="API Code Snippets (cURL, Python, TS)"
            >
              <Terminal className="w-3.5 h-3.5 text-primary" />
              API Code
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => agentId && setVersionDrawerOpen(true)}
            disabled={!agentId}
            title="Version history"
            className="gap-1.5 text-xs hidden sm:flex"
          >
            <History className="w-3.5 h-3.5" />
            History
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => agentId && router.push(`/agents/${agentId}/playground`)}
            disabled={!agentId}
            className="gap-1.5 text-xs bg-primary/5 text-primary border-primary/20 hover:bg-primary/10"
          >
            <Play className="w-3.5 h-3.5 fill-primary" />
            Test
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving} className="gap-1.5 shadow-sm">
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save
          </Button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 w-full flex-1">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8 flex-wrap h-auto p-1 bg-muted/70 rounded-xl gap-1 border">
            <TabsTrigger value="general" className="rounded-lg text-xs gap-1.5 py-1.5">
              <Sliders className="w-3.5 h-3.5" /> General
            </TabsTrigger>
            <TabsTrigger value="prompt" className="rounded-lg text-xs gap-1.5 py-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Prompt
            </TabsTrigger>
            <TabsTrigger value="input" className="rounded-lg text-xs gap-1.5 py-1.5">
              <FileText className="w-3.5 h-3.5" /> Input
            </TabsTrigger>
            <TabsTrigger value="output" className="rounded-lg text-xs gap-1.5 py-1.5">
              <Code2 className="w-3.5 h-3.5" /> Output
            </TabsTrigger>
            <TabsTrigger value="resources" className="rounded-lg text-xs gap-1.5 py-1.5">
              <Database className="w-3.5 h-3.5" /> Resources
            </TabsTrigger>
            <TabsTrigger value="external-apis" className="rounded-lg text-xs gap-1.5 py-1.5">
              <Globe className="w-3.5 h-3.5" /> External APIs
            </TabsTrigger>
            <TabsTrigger value="custom-tool" className="rounded-lg text-xs gap-1.5 py-1.5">
              <Wrench className="w-3.5 h-3.5" /> Custom Tool
            </TabsTrigger>
            <TabsTrigger value="advanced" className="rounded-lg text-xs gap-1.5 py-1.5">
              <Shield className="w-3.5 h-3.5" /> Advanced
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <GeneralTab form={form} onChange={updateForm} onConfigChange={updateConfig} config={form.config} />
          </TabsContent>
          <TabsContent value="prompt">
            <PromptTab config={form.config} onChange={updateConfig} />
          </TabsContent>
          <TabsContent value="input">
            <InputTab config={form.config} onChange={updateConfig} />
          </TabsContent>
          <TabsContent value="output">
            <OutputTab config={form.config} onChange={updateConfig} />
          </TabsContent>
          <TabsContent value="resources">
            <ResourcesTab agentId={agentId} />
          </TabsContent>
          <TabsContent value="external-apis">
            <ExternalApisTab
              externalApis={form.externalApis}
              onChange={(apis) => updateForm({ externalApis: apis })}
            />
          </TabsContent>
          <TabsContent value="custom-tool">
            <CustomToolTab
              customTool={form.customTool}
              onChange={(tool) => updateForm({ customTool: tool })}
            />
          </TabsContent>
          <TabsContent value="advanced">
            <AdvancedTab
              config={form.config}
              onChange={updateConfig}
              agentId={agentId}
              hasApiKey={!!existingAgent?.apiKeyHash}
              onApiKeyChanged={() => updateAgent.mutate({ id: agentId!, data: {} })}
            />
          </TabsContent>
        </Tabs>
      </div>

      {agentId && (
        <>
          <VersionHistoryDrawer
            agentId={agentId}
            open={versionDrawerOpen}
            onClose={() => setVersionDrawerOpen(false)}
            onRestore={(snapshot) => {
              updateForm({
                name: snapshot.name,
                description: snapshot.description,
                status: snapshot.status,
                config: snapshot.config,
                customTool: snapshot.customTool,
                externalApis: snapshot.externalApis,
              });
            }}
          />
          <ApiSnippetsDialog
            agent={existingAgent || null}
            open={apiSnippetsOpen}
            onClose={() => setApiSnippetsOpen(false)}
          />
        </>
      )}
    </div>
  );
}
