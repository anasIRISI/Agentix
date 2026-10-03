"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Upload, Bot, Search, Filter, Sparkles, Cpu, Activity, Layers, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AgentTable } from "./AgentTable";
import { EmptyState } from "./EmptyState";
import { ImportAgentDialog } from "./ImportAgentDialog";
import { useAgents, useCreateAgent } from "@/lib/hooks/useAgents";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function DashboardPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "active">("all");
  const [importOpen, setImportOpen] = useState(false);

  const { data: agents, isLoading } = useAgents(
    search || undefined,
    statusFilter !== "all" ? statusFilter : undefined
  );
  const createAgent = useCreateAgent();

  async function handleCreateNew() {
    router.push("/agents/new");
  }

  // Calculate metrics
  const totalAgents = agents?.length || 0;
  const activeAgents = agents?.filter((a) => a.status === "active").length || 0;
  const totalRuns = agents?.reduce((acc, a) => acc + (a.runsCount || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="border-b bg-card/70 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-purple-400 flex items-center justify-center shadow-md shadow-primary/20">
              <Bot className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                AgentForge
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                PRO Studio
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex items-center gap-2 text-muted-foreground border-muted-foreground/20 hover:border-primary/40"
              onClick={() => {
                window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }));
              }}
              aria-label="Open command palette"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="text-xs">Search</span>
              <kbd className="ml-1 text-[10px] bg-muted px-1.5 py-0.5 rounded border">⌘K</kbd>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)} className="gap-1.5">
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Import JSON</span>
            </Button>
            <Button size="sm" onClick={handleCreateNew} className="gap-1.5 shadow-md shadow-primary/20">
              <Plus className="w-4 h-4" />
              New agent
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">
        {/* Header & Stats Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">AI Agents Studio</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Build, test, deploy and automate intelligent LLM agents powered by Gemini.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Gemini 3.8 / 2.5 Active
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {totalAgents > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border bg-card/60 backdrop-blur-sm shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Agents</p>
                <p className="text-2xl font-bold mt-1">{totalAgents}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-xl border bg-card/60 backdrop-blur-sm shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Active Agents</p>
                <p className="text-2xl font-bold text-emerald-500 mt-1">{activeAgents}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-xl border bg-card/60 backdrop-blur-sm shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Executions</p>
                <p className="text-2xl font-bold mt-1">{totalRuns}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-xl border bg-card/60 backdrop-blur-sm shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Core Engine</p>
                <p className="text-sm font-bold truncate mt-1">Google Gemini</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search agents by name or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card/50"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="w-36 bg-card/50">
              <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : !agents || agents.length === 0 ? (
          <EmptyState onCreateNew={handleCreateNew} />
        ) : (
          <AgentTable agents={agents} />
        )}
      </main>

      <ImportAgentDialog open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}

