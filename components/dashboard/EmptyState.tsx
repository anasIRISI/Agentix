"use client";
import { Bot, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreateAgent } from "@/lib/hooks/useAgents";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const TEMPLATES = [
  {
    name: "Support Ticket Analyzer",
    description: "Categorizes customer requests, evaluates sentiment, priority and suggested reply",
    emoji: "🎧",
    config: {
      model: "gemini-3.8-flash",
      temperature: 0.2,
      maxTokens: 1024,
      systemPrompt: `You are an expert customer support AI. Analyze the following customer message:\n\n"{{customer_message}}"\n\nIdentify the category, customer sentiment, urgency/priority, and write a polite suggested response.`,
      inputParams: [
        { id: "1", name: "customer_message", type: "string" as const, required: true, description: "Customer message or email" },
      ],
      outputFormat: "json" as const,
      outputSchema: JSON.stringify({
        type: "object",
        properties: {
          category: { type: "string" },
          sentiment: { type: "string", enum: ["positive", "neutral", "negative", "frustrated"] },
          priority: { type: "string", enum: ["low", "medium", "high", "critical"] },
          summary: { type: "string" },
          suggested_reply: { type: "string" },
        },
        required: ["category", "sentiment", "priority", "summary", "suggested_reply"],
      }, null, 2),
      strictValidation: false,
      maxIterations: 1,
      repairRetries: 1,
      timeoutMs: 30000,
    },
  },
  {
    name: "Code Reviewer & Bug Explainer",
    description: "Analyzes code snippets, spots bugs, security flaws, and suggests refactoring",
    emoji: "💻",
    config: {
      model: "gemini-3.8-flash",
      temperature: 0.1,
      maxTokens: 2048,
      systemPrompt: `You are a Principal Software Engineer. Review the provided code in language "{{language}}":\n\n\`\`\`\n{{code}}\n\`\`\`\n\nSpot potential bugs, security issues, performance bottlenecks, and provide an optimized replacement.`,
      inputParams: [
        { id: "1", name: "language", type: "string" as const, required: true, description: "Programming language (e.g. typescript, python)" },
        { id: "2", name: "code", type: "string" as const, required: true, description: "Source code to inspect" },
      ],
      outputFormat: "json" as const,
      outputSchema: JSON.stringify({
        type: "object",
        properties: {
          quality_score: { type: "number" },
          issues: { type: "array", items: { type: "string" } },
          security_concerns: { type: "array", items: { type: "string" } },
          refactored_code: { type: "string" },
          explanation: { type: "string" },
        },
        required: ["quality_score", "issues", "refactored_code", "explanation"],
      }, null, 2),
      strictValidation: false,
      maxIterations: 1,
      repairRetries: 1,
      timeoutMs: 30000,
    },
  },
  {
    name: "SQL Query Assistant",
    description: "Generates optimized SQL queries from plain English descriptions",
    emoji: "🗄️",
    config: {
      model: "gemini-3.8-flash",
      temperature: 0.1,
      maxTokens: 1024,
      systemPrompt: `You are a database architect. Translate the request into safe, optimized SQL query for dialect "{{dialect}}".\n\nSchema: {{table_schema}}\nRequest: {{natural_query}}`,
      inputParams: [
        { id: "1", name: "natural_query", type: "string" as const, required: true, description: "What data you need in English" },
        { id: "2", name: "dialect", type: "string" as const, required: true, description: "SQL dialect (e.g. postgres, mysql, sqlite)" },
        { id: "3", name: "table_schema", type: "string" as const, required: false, description: "Optional table names and columns" },
      ],
      outputFormat: "json" as const,
      outputSchema: JSON.stringify({
        type: "object",
        properties: {
          sql: { type: "string" },
          explanation: { type: "string" },
          performance_tips: { type: "array", items: { type: "string" } },
        },
        required: ["sql", "explanation"],
      }, null, 2),
      strictValidation: false,
      maxIterations: 1,
      repairRetries: 1,
      timeoutMs: 30000,
    },
  },
  {
    name: "Data Extractor & Normalizer",
    description: "Extracts dates, emails, organizations and amounts into normalized JSON",
    emoji: "🔍",
    config: {
      model: "gemini-3.8-flash",
      temperature: 0.1,
      maxTokens: 1024,
      systemPrompt: "Extract all key entities, contacts, dates and financials from the text into clean structured JSON.\n\nText: {{text}}",
      inputParams: [
        { id: "1", name: "text", type: "string" as const, required: true, description: "Raw text to extract entities from" },
      ],
      outputFormat: "json" as const,
      outputSchema: JSON.stringify({
        type: "object",
        properties: {
          entities: { type: "array", items: { type: "string" } },
          dates: { type: "array", items: { type: "string" } },
          contacts: { type: "array", items: { type: "string" } },
          key_metrics: { type: "object" },
        },
        required: ["entities"],
      }, null, 2),
      strictValidation: false,
      maxIterations: 1,
      repairRetries: 1,
      timeoutMs: 30000,
    },
  },
  {
    name: "Meeting Notes & Action Items",
    description: "Converts messy call transcripts into structured decisions and action items",
    emoji: "📝",
    config: {
      model: "gemini-3.8-flash",
      temperature: 0.2,
      maxTokens: 1536,
      systemPrompt: "Structure the following meeting transcript into an executive summary, key decisions, and action items with assignees.\n\nTranscript: {{transcript}}",
      inputParams: [
        { id: "1", name: "transcript", type: "string" as const, required: true, description: "Meeting dialogue or notes" },
      ],
      outputFormat: "json" as const,
      outputSchema: JSON.stringify({
        type: "object",
        properties: {
          summary: { type: "string" },
          decisions: { type: "array", items: { type: "string" } },
          action_items: {
            type: "array",
            items: {
              type: "object",
              properties: { task: { type: "string" }, assignee: { type: "string" } },
              required: ["task"],
            },
          },
        },
        required: ["summary", "decisions", "action_items"],
      }, null, 2),
      strictValidation: false,
      maxIterations: 1,
      repairRetries: 1,
      timeoutMs: 30000,
    },
  },
  {
    name: "Smart Translator & Tone Adapter",
    description: "Translates text while adjusting tone (formal, casual, persuasive)",
    emoji: "🌐",
    config: {
      model: "gemini-3.8-flash",
      temperature: 0.3,
      maxTokens: 1024,
      systemPrompt: `Translate the following text into "{{target_language}}" with a "{{tone}}" tone.\n\nText: {{text}}`,
      inputParams: [
        { id: "1", name: "text", type: "string" as const, required: true, description: "Original text" },
        { id: "2", name: "target_language", type: "string" as const, required: true, description: "Target language (e.g. Spanish, German, French)" },
        { id: "3", name: "tone", type: "string" as const, required: true, description: "Desired tone (formal, executive, friendly)" },
      ],
      outputFormat: "json" as const,
      outputSchema: JSON.stringify({
        type: "object",
        properties: {
          translation: { type: "string" },
          cultural_notes: { type: "string" },
          alternative_phrasings: { type: "array", items: { type: "string" } },
        },
        required: ["translation"],
      }, null, 2),
      strictValidation: false,
      maxIterations: 1,
      repairRetries: 1,
      timeoutMs: 30000,
    },
  },
];

export function EmptyState({ onCreateNew }: { onCreateNew: () => void }) {
  const createAgent = useCreateAgent();
  const router = useRouter();

  async function handleTemplate(tpl: (typeof TEMPLATES)[0]) {
    try {
      const agent = await createAgent.mutateAsync({
        name: tpl.name,
        description: tpl.description,
        status: "active",
        config: tpl.config,
      });
      toast.success(`Created agent "${tpl.name}" from template!`);
      router.push(`/agents/${agent.id}/edit`);
    } catch {
      toast.error("Failed to create agent from template");
    }
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 shadow-lg shadow-primary/5">
        <Bot className="w-8 h-8 text-primary animate-pulse" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight mb-2">No agents yet</h2>
      <p className="text-muted-foreground text-sm max-w-md mb-8">
        Build, configure and deploy autonomous AI agents with typed inputs, custom tools and structured outputs.
      </p>
      <Button onClick={onCreateNew} size="lg" className="mb-12 shadow-md gap-2">
        <Plus className="w-4 h-4" />
        Create custom agent
      </Button>

      <div className="w-full max-w-4xl">
        <div className="flex items-center justify-between mb-4 px-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Quick-start Production Templates
          </p>
          <span className="text-xs text-muted-foreground">Click to instantiate</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {TEMPLATES.map((tpl) => (
            <button
              key={tpl.name}
              onClick={() => handleTemplate(tpl)}
              disabled={createAgent.isPending}
              className="group relative rounded-xl border bg-card/60 hover:bg-card p-4 text-left hover:border-primary/50 hover:shadow-md transition-all duration-200 disabled:opacity-50 flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition-transform">
                  {tpl.emoji}
                </div>
                <p className="font-semibold text-sm group-hover:text-primary transition-colors">{tpl.name}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{tpl.description}</p>
              </div>
              <div className="mt-3 pt-3 border-t flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="font-mono">{tpl.config.model}</span>
                <span className="text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">Use template →</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

