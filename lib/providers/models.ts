export interface ModelCapabilities {
  supportsToolsWithStructuredOutput: boolean;
  supportsStreaming: boolean;
  contextWindow: number;
  inputCostPer1M?: number;
  outputCostPer1M?: number;
}

export interface ModelDefinition {
  id: string;
  name: string;
  capabilities: ModelCapabilities;
  description?: string;
}

export const GEMINI_MODELS: ModelDefinition[] = [
  {
    id: "gemini-3.8-flash",
    name: "Gemini 3.8 Flash",
    description: "Latest, high-performance & fast model. Recommended default.",
    capabilities: {
      supportsToolsWithStructuredOutput: false,
      supportsStreaming: true,
      contextWindow: 1048576,
    },
  },
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    description: "Fast and balanced model.",
    capabilities: {
      supportsToolsWithStructuredOutput: false,
      supportsStreaming: true,
      contextWindow: 1048576,
    },
  },
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    description: "Fast model for standard tasks.",
    capabilities: {
      supportsToolsWithStructuredOutput: false,
      supportsStreaming: true,
      contextWindow: 1048576,
    },
  },
  {
    id: "gemini-2.0-flash-lite",
    name: "Gemini 2.0 Flash Lite",
    description: "Lightest model, best for high-volume, low-complexity tasks.",
    capabilities: {
      supportsToolsWithStructuredOutput: false,
      supportsStreaming: true,
      contextWindow: 1048576,
    },
  },
  {
    id: "gemini-1.5-flash",
    name: "Gemini 1.5 Flash",
    description: "Legacy balanced speed and capability.",
    capabilities: {
      supportsToolsWithStructuredOutput: false,
      supportsStreaming: true,
      contextWindow: 1048576,
    },
  },
  {
    id: "gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    description: "Most capable model for complex reasoning tasks.",
    capabilities: {
      supportsToolsWithStructuredOutput: false,
      supportsStreaming: true,
      contextWindow: 2097152,
    },
  },
];

export function getModel(id: string): ModelDefinition {
  const found = GEMINI_MODELS.find((m) => m.id === id);
  if (found) return found;

  // Fallback for custom or newly released models
  return {
    id,
    name: id,
    description: "Custom / Dynamic Gemini model",
    capabilities: {
      supportsToolsWithStructuredOutput: false,
      supportsStreaming: true,
      contextWindow: 1048576,
    },
  };
}

export function getDefaultModel(): ModelDefinition {
  const defaultId = process.env.GEMINI_DEFAULT_MODEL || "gemini-3.8-flash";
  return getModel(defaultId);
}

