export type ApiProvider = "openai" | "anthropic" | "google" | "azure" | "bedrock" | "openrouter" | null;

// Model override configuration for subagents, internal functions, and tools
export interface ModelOverrides {
  // Subagent model configuration
  subagents?: {
    'general-purpose'?: string | null; // null = inherit from main agent
    // Reserved for custom subagent configurations
    [key: string]: string | null | undefined;
  };
  // Internal function model configuration
  summarization?: string | null; // null = inherit from main agent
  suggestions?: string | null; // null = inherit from main agent (for follow-up suggestions)
  // Tool model configuration (reserved, tools don't need models currently)
  tools?: {
    [toolName: string]: string | null | undefined;
  };
}

// Model overrides stored per provider
export type ModelOverridesByProvider = {
  [provider: string]: ModelOverrides;
};

// Azure OpenAI configuration
export interface AzureOpenAIConfig {
  baseUrl: string;
  apiKey: string;
}

// AWS Bedrock configuration
export interface AWSBedrockConfig {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

// OpenRouter configuration (also works for other OpenAI-compatible APIs)
export interface OpenRouterConfig {
  baseUrl: string;
  apiKey: string;
}

export interface StandaloneConfig {
  deploymentUrl: string;
  assistantId: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  googleApiKey?: string;
  // Azure OpenAI
  azureConfig?: AzureOpenAIConfig;
  // AWS Bedrock
  bedrockConfig?: AWSBedrockConfig;
  // OpenRouter / Custom OpenAI-compatible API
  openRouterConfig?: OpenRouterConfig;
  // Store API keys for each OpenAI Compatible provider separately
  openAICompatibleApiKeys?: Record<string, string>;
  activeProvider?: ApiProvider;
  selectedModel?: string;
  // Store selected model for each provider
  // For OpenAI Compatible (openrouter), keys can be "openrouter:DeerAPI", "openrouter:ZenMux", etc.
  selectedModels?: Record<string, string>;
  // Advanced model overrides configuration (legacy, global)
  modelOverrides?: ModelOverrides;
  // Model overrides stored per provider (new, preferred)
  modelOverridesByProvider?: ModelOverridesByProvider;
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

// Function to validate Azure OpenAI configuration
export async function validateAzureOpenAI(config: AzureOpenAIConfig): Promise<{ valid: boolean; models: string[]; error?: string }> {
  if (!config.baseUrl || !config.apiKey) {
    return { valid: false, models: [], error: "Base URL and API Key are required" };
  }

  try {
    // Normalize the base URL
    let baseUrl = config.baseUrl.trim();
    if (!baseUrl.startsWith("https://")) {
      baseUrl = `https://${baseUrl}`;
    }
    if (baseUrl.endsWith("/")) {
      baseUrl = baseUrl.slice(0, -1);
    }

    // Try to list deployments to validate the configuration
    const response = await fetch(
      `${baseUrl}/openai/deployments?api-version=2023-05-15`,
      {
        headers: {
          "api-key": config.apiKey,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Azure OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    // Extract deployment names as available models
    const models = data.data
      ?.map((d: { id: string }) => d.id)
      .sort() || [];

    return { valid: true, models };
  } catch (error) {
    console.error("Failed to validate Azure OpenAI:", error);
    return {
      valid: false,
      models: [],
      error: error instanceof Error ? error.message : "Validation failed"
    };
  }
}

// Function to validate OpenRouter / OpenAI-compatible API configuration
export async function validateOpenRouter(config: OpenRouterConfig): Promise<{ valid: boolean; models: string[]; error?: string }> {
  if (!config.baseUrl || !config.apiKey) {
    return { valid: false, models: [], error: "Base URL and API Key are required" };
  }

  try {
    // Normalize the base URL
    let baseUrl = config.baseUrl.trim();
    if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
      baseUrl = `https://${baseUrl}`;
    }
    if (baseUrl.endsWith("/")) {
      baseUrl = baseUrl.slice(0, -1);
    }

    // OpenRouter and most OpenAI-compatible APIs support /v1/models endpoint
    const response = await fetch(`${baseUrl}/models`, {
      headers: {
        "Authorization": `Bearer ${config.apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    // Extract model IDs - compatible with OpenAI format
    const models = data.data
      ?.map((m: { id: string }) => m.id)
      .sort() || [];

    return { valid: true, models };
  } catch (error) {
    console.error("Failed to validate OpenRouter:", error);
    return {
      valid: false,
      models: [],
      error: error instanceof Error ? error.message : "Validation failed"
    };
  }
}

// Function to validate AWS Bedrock configuration
export async function validateAWSBedrock(config: AWSBedrockConfig): Promise<{ valid: boolean; models: string[]; error?: string }> {
  if (!config.accessKeyId || !config.secretAccessKey || !config.region) {
    return { valid: false, models: [], error: "Access Key ID, Secret Access Key and Region are required" };
  }

  try {
    // AWS Bedrock requires Signature V4 authentication
    // We'll use a simplified approach - try to list foundation models
    const service = "bedrock";
    const host = `${service}.${config.region}.amazonaws.com`;
    const endpoint = `https://${host}/foundation-models`;
    
    // Create the request
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);
    
    // Create canonical request
    const method = "GET";
    const canonicalUri = "/foundation-models";
    const canonicalQueryString = "";
    const canonicalHeaders = `host:${host}\nx-amz-date:${amzDate}\n`;
    const signedHeaders = "host;x-amz-date";
    const payloadHash = await sha256("");
    const canonicalRequest = `${method}\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
    
    // Create string to sign
    const algorithm = "AWS4-HMAC-SHA256";
    const credentialScope = `${dateStamp}/${config.region}/${service}/aws4_request`;
    const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${await sha256(canonicalRequest)}`;
    
    // Calculate signature
    const signingKey = await getSignatureKey(config.secretAccessKey, dateStamp, config.region, service);
    const signature = await hmacHex(signingKey, stringToSign);
    
    // Create authorization header
    const authorizationHeader = `${algorithm} Credential=${config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
    
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Host": host,
        "X-Amz-Date": amzDate,
        "Authorization": authorizationHeader,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AWS Bedrock API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    // Extract model IDs
    const models = data.modelSummaries
      ?.map((m: { modelId: string }) => m.modelId)
      .sort() || [];

    return { valid: true, models };
  } catch (error) {
    console.error("Failed to validate AWS Bedrock:", error);
    return {
      valid: false,
      models: [],
      error: error instanceof Error ? error.message : "Validation failed"
    };
  }
}

// Helper functions for AWS Signature V4
async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmac(key: ArrayBuffer, message: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(message));
}

async function hmacHex(key: ArrayBuffer, message: string): Promise<string> {
  const result = await hmac(key, message);
  return Array.from(new Uint8Array(result))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

async function getSignatureKey(secretKey: string, dateStamp: string, region: string, service: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const kDate = await hmac(encoder.encode("AWS4" + secretKey), dateStamp);
  const kRegion = await hmac(kDate, region);
  const kService = await hmac(kRegion, service);
  const kSigning = await hmac(kService, "aws4_request");
  return kSigning;
}

// Function to validate API key and get models
export async function validateAndFetchModels(
  provider: ApiProvider,
  apiKey: string,
  azureConfig?: AzureOpenAIConfig,
  bedrockConfig?: AWSBedrockConfig,
  openRouterConfig?: OpenRouterConfig
): Promise<{ valid: boolean; models: string[]; error?: string }> {
  try {
    switch (provider) {
      case "openai":
        if (!apiKey) {
          return { valid: false, models: [], error: "API key is required" };
        }
        const openaiModels = await fetchOpenAIModels(apiKey);
        return { valid: true, models: openaiModels };
      
      case "anthropic":
        if (!apiKey) {
          return { valid: false, models: [], error: "API key is required" };
        }
        const anthropicModels = await fetchAnthropicModels(apiKey);
        return { valid: true, models: anthropicModels };
      
      case "google":
        if (!apiKey) {
          return { valid: false, models: [], error: "API key is required" };
        }
        const googleModels = await fetchGoogleModels(apiKey);
        return { valid: true, models: googleModels };
      
      case "azure":
        if (!azureConfig) {
          return { valid: false, models: [], error: "Azure configuration is required" };
        }
        return await validateAzureOpenAI(azureConfig);
      
      case "bedrock":
        if (!bedrockConfig) {
          return { valid: false, models: [], error: "AWS Bedrock configuration is required" };
        }
        return await validateAWSBedrock(bedrockConfig);
      
      case "openrouter":
        if (!openRouterConfig) {
          return { valid: false, models: [], error: "OpenRouter configuration is required" };
        }
        return await validateOpenRouter(openRouterConfig);
      
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
    case "azure":
      return config.azureConfig?.apiKey || "";
    case "bedrock":
      // For Bedrock, we use access key as the "api key" for header purposes
      return config.bedrockConfig?.accessKeyId || "";
    case "openrouter":
      return config.openRouterConfig?.apiKey || "";
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
    case "azure":
      return "azure";
    case "bedrock":
      return "bedrock";
    case "openrouter":
      // OpenRouter uses OpenAI-compatible format
      return "openai";
    default:
      return "openai";
  }
}
