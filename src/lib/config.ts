export type ApiProvider = "openai" | "anthropic" | "google" | null;

export interface StandaloneConfig {
  deploymentUrl: string;
  assistantId: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  googleApiKey?: string;
  activeProvider?: ApiProvider;
  selectedModel?: string;
  // Store selected model for each provider
  selectedModels?: {
    openai?: string;
    anthropic?: string;
    google?: string;
  };
}

// Function to fetch OpenAI models
export async function fetchOpenAIModels(apiKey: string): Promise<string[]> {
  try {
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
    });
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    const data = await response.json();
    // Filter to only show chat models (gpt-*)
    const models = data.data
      .map((m: { id: string }) => m.id)
      .filter((id: string) => id.startsWith("gpt-") || id.startsWith("o1") || id.startsWith("o3"))
      .sort();
    return models;
  } catch (error) {
    console.error("Failed to fetch OpenAI models:", error);
    throw error;
  }
}

// Function to fetch Anthropic models
export async function fetchAnthropicModels(apiKey: string): Promise<string[]> {
  try {
    const response = await fetch("https://api.anthropic.com/v1/models", {
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
    });
    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }
    const data = await response.json();
    // Extract model IDs
    const models = data.data
      .map((m: { id: string }) => m.id)
      .sort();
    return models;
  } catch (error) {
    console.error("Failed to fetch Anthropic models:", error);
    throw error;
  }
}

// Function to fetch Google Gemini models
export async function fetchGoogleModels(apiKey: string): Promise<string[]> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    if (!response.ok) {
      throw new Error(`Google API error: ${response.status}`);
    }
    const data = await response.json();
    // Extract model names and filter for gemini models
    const models = data.models
      .map((m: { name: string }) => m.name.replace("models/", ""))
      .filter((name: string) => name.includes("gemini"))
      .sort();
    return models;
  } catch (error) {
    console.error("Failed to fetch Google models:", error);
    throw error;
  }
}

// Function to validate API key and get models
export async function validateAndFetchModels(
  provider: ApiProvider,
  apiKey: string
): Promise<{ valid: boolean; models: string[]; error?: string }> {
  if (!apiKey) {
    return { valid: false, models: [], error: "API key is required" };
  }

  try {
    switch (provider) {
      case "openai":
        const openaiModels = await fetchOpenAIModels(apiKey);
        return { valid: true, models: openaiModels };
      
      case "anthropic":
        const anthropicModels = await fetchAnthropicModels(apiKey);
        return { valid: true, models: anthropicModels };
      
      case "google":
        const googleModels = await fetchGoogleModels(apiKey);
        return { valid: true, models: googleModels };
      
      
      default:
        return { valid: false, models: [], error: "Unknown provider" };
    }
  } catch (error) {
    return { 
      valid: false, 
      models: [], 
      error: error instanceof Error ? error.message : "Validation failed" 
    };
  }
}

const CONFIG_KEY = "deep-agent-config";

export function getConfig(): StandaloneConfig | null {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem(CONFIG_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function saveConfig(config: StandaloneConfig): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

export function getActiveApiKey(config: StandaloneConfig | null): string {
  if (!config || !config.activeProvider) return "";
  
  switch (config.activeProvider) {
    case "openai":
      return config.openaiApiKey || "";
    case "anthropic":
      return config.anthropicApiKey || "";
    case "google":
      return config.googleApiKey || "";
    default:
      return "";
  }
}

export function getAuthScheme(provider: ApiProvider): string {
  switch (provider) {
    case "openai":
      return "openai";
    case "anthropic":
      return "anthropic";
    case "google":
      return "google";
    default:
      return "openai";
  }
}
