import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Edit, Play, Copy, Download, Trash2, MoreHorizontal, Link, CheckCircle, Clock, Terminal,
  LayoutGrid, List, Bot, Cpu, ArrowUpRight, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeleteAgent, useDuplicateAgent } from "@/lib/hooks/useAgents";
import { formatRelative, copyToClipboard } from "@/lib/utils";
import type { Agent } from "@/lib/schemas/agent";
import { toast } from "sonner";
import { ApiSnippetsDialog } from "./ApiSnippetsDialog";

export function AgentTable({ agents }: { agents: Agent[] }) {
  const router = useRouter();
  const deleteAgent = useDeleteAgent();
  const duplicateAgent = useDuplicateAgent();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [snippetAgent, setSnippetAgent] = useState<Agent | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  function handleExport(agent: Agent) {
    const data = {
      name: agent.name,
      description: agent.description,
      config: agent.config,
      customTool: agent.customTool,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${agent.name.replace(/\s+/g, "-").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Agent exported as JSON");
  }

  function handleCopyEndpoint(agent: Agent) {
    const url = `${window.location.origin}/api/agents/${agent.id}/run`;
    copyToClipboard(url).then(() => toast.success("API endpoint copied to clipboard"));
  }

  return (
    <>
      {/* View Mode Toggle Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {agents.length} Agent{agents.length > 1 ? "s" : ""} Available
        </p>
        <div className="flex items-center p-1 bg-muted/60 border rounded-lg gap-0.5">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="sm"
            className={`h-7 px-2.5 text-xs gap-1.5 rounded-md ${viewMode === "grid" ? "shadow-xs font-semibold text-foreground" : "text-muted-foreground"}`}
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Cards
          </Button>
          <Button
            variant={viewMode === "table" ? "secondary" : "ghost"}
            size="sm"
            className={`h-7 px-2.5 text-xs gap-1.5 rounded-md ${viewMode === "table" ? "shadow-xs font-semibold text-foreground" : "text-muted-foreground"}`}
            onClick={() => setViewMode("table")}
          >
            <List className="w-3.5 h-3.5" />
            Table
          </Button>
        </div>
      </div>

      {/* Grid Cards View */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="group relative rounded-2xl border bg-card/70 hover:bg-card backdrop-blur-sm p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/40"
            >
              <div>
                {/* Card Top Row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary/20 to-purple-500/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-base shadow-xs group-hover:scale-105 transition-transform">
                      <Bot className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3
                        onClick={() => router.push(`/agents/${agent.id}/edit`)}
                        className="font-bold text-base hover:text-primary transition-colors cursor-pointer leading-snug line-clamp-1"
                      >
                        {agent.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] font-mono text-muted-foreground">
                          {agent.config.model}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Badge
                    variant={agent.status === "active" ? "default" : "secondary"}
                    className={
                      agent.status === "active"
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30 text-[11px] font-semibold"
                        : "text-[11px]"
                    }
                  >
                    {agent.status === "active" ? (
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active
                      </span>
                    ) : (
                      "Draft"
                    )}
                  </Badge>
                </div>

                {/* Description */}
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-4 min-h-[32px]">
                  {agent.description || "No description provided for this agent."}
                </p>

                {/* Meta details */}
                <div className="flex items-center gap-2 mb-4 flex-wrap text-[11px]">
                  <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground border">
                    {agent.config.inputParams?.length || 0} input{agent.config.inputParams?.length !== 1 ? "s" : ""}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground border">
                    {agent.config.outputFormat.toUpperCase()} output
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground border">
                    {agent.runsCount} run{agent.runsCount !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    className="h-8 px-3 text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xs"
                    onClick={() => router.push(`/agents/${agent.id}/playground`)}
                  >
                    <Play className="w-3.5 h-3.5 fill-primary-foreground" />
                    Test
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2.5 text-xs gap-1 hover:border-primary/40"
                    onClick={() => setSnippetAgent(agent)}
                    title="API Integration Snippet"
                  >
                    <Terminal className="w-3.5 h-3.5 text-primary" />
                    API
                  </Button>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-muted"
                    onClick={() => router.push(`/agents/${agent.id}/edit`)}
                    title="Edit Agent"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => setSnippetAgent(agent)}>
                        <Terminal className="w-4 h-4 mr-2 text-primary" /> View API Code
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCopyEndpoint(agent)}>
                        <Link className="w-4 h-4 mr-2" /> Copy Endpoint URL
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => duplicateAgent.mutate(agent.id)}>
                        <Copy className="w-4 h-4 mr-2" /> Duplicate Agent
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport(agent)}>
                        <Download className="w-4 h-4 mr-2" /> Export JSON
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleteId(agent.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table List View */
        <div className="rounded-xl border bg-card/70 backdrop-blur-sm shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-xs">
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Agent Name</th>
                <th className="text-left px-4 py-3.5 font-semibold text-muted-foreground hidden md:table-cell">Model</th>
                <th className="text-left px-4 py-3.5 font-semibold text-muted-foreground hidden sm:table-cell">Status</th>
                <th className="text-left px-4 py-3.5 font-semibold text-muted-foreground hidden lg:table-cell">Executions</th>
                <th className="text-left px-4 py-3.5 font-semibold text-muted-foreground hidden lg:table-cell">Last Updated</th>
                <th className="text-right px-5 py-3.5 font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {agents.map((agent) => (
                <tr
                  key={agent.id}
                  className="hover:bg-accent/40 transition-colors group"
                >
                  <td className="px-5 py-3.5">
                    <div>
                      <button
                        onClick={() => router.push(`/agents/${agent.id}/edit`)}
                        className="font-semibold hover:text-primary transition-colors text-left flex items-center gap-1.5"
                      >
                        {agent.name}
                      </button>
                      {agent.description ? (
                        <p className="text-xs text-muted-foreground mt-0.5 max-w-sm truncate">
                          {agent.description}
                        </p>
                      ) : (
                        <p className="text-[11px] text-muted-foreground/60 italic mt-0.5">No description provided</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <span className="text-xs font-mono text-muted-foreground bg-muted/80 border px-2 py-0.5 rounded-md">
                      {agent.config.model}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 hidden sm:table-cell">
                    <Badge
                      variant={agent.status === "active" ? "default" : "secondary"}
                      className={agent.status === "active" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30" : ""}
                    >
                      {agent.status === "active" ? (
                        <><CheckCircle className="w-3 h-3 mr-1 text-emerald-500" />Active</>
                      ) : (
                        <><Clock className="w-3 h-3 mr-1 text-muted-foreground" />Draft</>
                      )}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell text-muted-foreground font-mono text-xs">
                    <span className="font-semibold text-foreground">{agent.runsCount}</span> runs
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell text-muted-foreground text-xs">
                    {formatRelative(agent.updatedAt)}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 text-xs bg-primary/5 hover:bg-primary/15 text-primary border-primary/20"
                        onClick={() => router.push(`/agents/${agent.id}/playground`)}
                        title="Open Playground"
                      >
                        <Play className="w-3.5 h-3.5 fill-primary" />
                        <span className="hidden xl:inline">Test</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-muted"
                        onClick={() => setSnippetAgent(agent)}
                        title="API Snippets (cURL, Python, TS)"
                      >
                        <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-muted"
                        onClick={() => router.push(`/agents/${agent.id}/edit`)}
                        title="Edit Agent"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => setSnippetAgent(agent)}>
                            <Terminal className="w-4 h-4 mr-2 text-primary" /> View API Code
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCopyEndpoint(agent)}>
                            <Link className="w-4 h-4 mr-2" /> Copy Endpoint URL
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => duplicateAgent.mutate(agent.id)}>
                            <Copy className="w-4 h-4 mr-2" /> Duplicate Agent
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExport(agent)}>
                            <Download className="w-4 h-4 mr-2" /> Export JSON
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteId(agent.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* API Code Snippets Dialog */}
      <ApiSnippetsDialog
        agent={snippetAgent}
        open={!!snippetAgent}
        onClose={() => setSnippetAgent(null)}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete agent?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the agent and all its runs. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteId) {
                  deleteAgent.mutate(deleteId);
                  setDeleteId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


