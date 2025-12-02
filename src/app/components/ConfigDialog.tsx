"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  StandaloneConfig,
  ApiProvider,
  validateAndFetchModels,
} from "@/lib/config";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

interface ConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: StandaloneConfig) => void;
  initialConfig?: StandaloneConfig;
}

interface ApiKeyFieldProps {
  id: string;
  provider: ApiProvider;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  isActive: boolean;
  onToggle: () => void;
  models: string[];
  selectedModel: string;
  onModelSelect: (model: string) => void;
  onValidate: () => void;
  isValidating: boolean;
  validationStatus: "idle" | "success" | "error";
  validationError?: string;
  showModelSelect: boolean;
}

function ApiKeyField({
  id,
  provider,
  label,
  placeholder,
  value,
  onChange,
  isActive,
  onToggle,
  models,
  selectedModel,
  onModelSelect,
  onValidate,
  isValidating,
  validationStatus,
  validationError,
  showModelSelect,
}: ApiKeyFieldProps) {
  return (
    <div
      className="grid gap-2 rounded-lg border p-3"
      style={{
        borderColor: isActive ? "var(--color-primary)" : "var(--color-border)",
        backgroundColor: isActive
          ? "rgba(var(--color-primary-rgb), 0.05)"
          : "transparent",
      }}
    >
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="flex items-center gap-2">
          {label}
          {isActive && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
              Active
            </span>
          )}
          {validationStatus === "success" && (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
          {validationStatus === "error" && (
            <XCircle className="h-4 w-4 text-red-500" />
          )}
        </Label>
        <Switch
          checked={isActive}
          onCheckedChange={onToggle}
          aria-label={`Enable ${label}`}
        />
      </div>

      <div className="flex gap-2">
        <Input
          id={id}
          type="password"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={!isActive}
          className={`flex-1 ${!isActive ? "opacity-50" : ""}`}
        />
        {showModelSelect && (
          <Button
            variant="outline"
            size="sm"
            onClick={onValidate}
            disabled={!isActive || !value || isValidating}
            className="whitespace-nowrap"
          >
            {isValidating ? (
              <>
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify"
            )}
          </Button>
        )}
      </div>

      {validationError && isActive && (
        <p className="text-xs text-red-500">{validationError}</p>
      )}

      {showModelSelect && models.length > 0 && isActive && (
        <div className="flex items-center gap-2">
          <Label className="text-sm whitespace-nowrap">Model:</Label>
          <Select value={selectedModel} onValueChange={onModelSelect}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              {models.map((model) => (
                <SelectItem key={model} value={model}>
                  {model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

export function ConfigDialog({
  open,
  onOpenChange,
  onSave,
  initialConfig,
}: ConfigDialogProps) {
  const [deploymentUrl, setDeploymentUrl] = useState(
    initialConfig?.deploymentUrl || ""
  );
  const [assistantId, setAssistantId] = useState(
    initialConfig?.assistantId || ""
  );
  const [openaiApiKey, setOpenaiApiKey] = useState(
    initialConfig?.openaiApiKey || ""
  );
  const [anthropicApiKey, setAnthropicApiKey] = useState(
    initialConfig?.anthropicApiKey || ""
  );
  const [googleApiKey, setGoogleApiKey] = useState(
    initialConfig?.googleApiKey || ""
  );
  const [activeProvider, setActiveProvider] = useState<ApiProvider>(
    initialConfig?.activeProvider || null
  );
  // Store selected model for each provider separately
  const [selectedModels, setSelectedModels] = useState<{
    openai?: string;
    anthropic?: string;
    google?: string;
  }>(initialConfig?.selectedModels || {});

  // Models state for each provider
  const [openaiModels, setOpenaiModels] = useState<string[]>([]);
  const [anthropicModels, setAnthropicModels] = useState<string[]>([]);
  const [googleModels, setGoogleModels] = useState<string[]>([]);

  // Validation state
  const [validatingProvider, setValidatingProvider] =
    useState<ApiProvider>(null);
  const [validationStatus, setValidationStatus] = useState<
    Record<string, "idle" | "success" | "error">
  >({});
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    if (open && initialConfig) {
      setDeploymentUrl(initialConfig.deploymentUrl);
      setAssistantId(initialConfig.assistantId);
      setOpenaiApiKey(initialConfig.openaiApiKey || "");
      setAnthropicApiKey(initialConfig.anthropicApiKey || "");
      setGoogleApiKey(initialConfig.googleApiKey || "");
      setActiveProvider(initialConfig.activeProvider || null);
      setSelectedModels(initialConfig.selectedModels || {});
    }
  }, [open, initialConfig]);

  const handleToggleProvider = (provider: ApiProvider) => {
    if (activeProvider === provider) {
      setActiveProvider(null);
    } else {
      setActiveProvider(provider);
    }
  };

  // Helper to get selected model for current provider
  const getSelectedModelForProvider = (provider: ApiProvider): string => {
    if (!provider) return "";
    return selectedModels[provider] || "";
  };

  // Helper to set selected model for a provider
  const setSelectedModelForProvider = (provider: ApiProvider, model: string) => {
    if (!provider) return;
    setSelectedModels((prev) => ({ ...prev, [provider]: model }));
  };

  const handleValidate = async (provider: ApiProvider) => {
    if (!provider) return;

    let apiKey = "";
    switch (provider) {
      case "openai":
        apiKey = openaiApiKey;
        break;
      case "anthropic":
        apiKey = anthropicApiKey;
        break;
      case "google":
        apiKey = googleApiKey;
        break;
      default:
        return;
    }

    setValidatingProvider(provider);
    setValidationStatus((prev) => ({ ...prev, [provider]: "idle" }));
    setValidationErrors((prev) => ({ ...prev, [provider]: "" }));

    try {
      const result = await validateAndFetchModels(provider, apiKey);

      if (result.valid) {
        setValidationStatus((prev) => ({ ...prev, [provider]: "success" }));

        // Update models list
        const currentSelection = selectedModels[provider];
        switch (provider) {
          case "openai":
            setOpenaiModels(result.models);
            // Only set default if no previous selection or previous selection not in list
            if (result.models.length > 0 && (!currentSelection || !result.models.includes(currentSelection))) {
              const defaultModel =
                result.models.find((m) => m === "gpt-4o") || result.models[0];
              setSelectedModelForProvider(provider, defaultModel);
            }
            break;
          case "google":
            setGoogleModels(result.models);
            if (result.models.length > 0 && (!currentSelection || !result.models.includes(currentSelection))) {
              const defaultModel =
                result.models.find((m) => m.includes("gemini-2.0-flash")) ||
                result.models[0];
              setSelectedModelForProvider(provider, defaultModel);
            }
            break;
          case "anthropic":
            setAnthropicModels(result.models);
            if (result.models.length > 0 && (!currentSelection || !result.models.includes(currentSelection))) {
              const defaultModel =
                result.models.find((m) => m.includes("claude-sonnet-4")) ||
                result.models.find((m) => m.includes("claude-3-5-sonnet")) ||
                result.models[0];
              setSelectedModelForProvider(provider, defaultModel);
            }
            break;
        }
      } else {
        setValidationStatus((prev) => ({ ...prev, [provider]: "error" }));
        setValidationErrors((prev) => ({
          ...prev,
          [provider]: result.error || "Validation failed",
        }));
      }
    } catch (error) {
      setValidationStatus((prev) => ({ ...prev, [provider]: "error" }));
      setValidationErrors((prev) => ({
        ...prev,
        [provider]:
          error instanceof Error ? error.message : "Validation failed",
      }));
    } finally {
      setValidatingProvider(null);
    }
  };

  const getModelsForProvider = (provider: ApiProvider): string[] => {
    switch (provider) {
      case "openai":
        return openaiModels;
      case "anthropic":
        return anthropicModels;
      case "google":
        return googleModels;
      default:
        return [];
    }
  };

  const handleSave = () => {
    if (!deploymentUrl || !assistantId) {
      alert("Please fill in all required fields");
      return;
    }

    // Get the selected model for the active provider
    const currentSelectedModel = activeProvider ? selectedModels[activeProvider] : undefined;

    onSave({
      deploymentUrl,
      assistantId,
      openaiApiKey: openaiApiKey || undefined,
      anthropicApiKey: anthropicApiKey || undefined,
      googleApiKey: googleApiKey || undefined,
      activeProvider,
      selectedModel: currentSelectedModel,
      selectedModels,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configuration</DialogTitle>
          <DialogDescription>
            Configure your LangGraph deployment settings. These settings are
            saved in your browser&apos;s local storage. Enable only one API key
            at a time.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Basic Settings */}
          <div className="grid gap-2">
            <Label htmlFor="deploymentUrl">Deployment URL</Label>
            <Input
              id="deploymentUrl"
              placeholder="https://<deployment-url>"
              value={deploymentUrl}
              onChange={(e) => setDeploymentUrl(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="assistantId">Assistant ID</Label>
            <Input
              id="assistantId"
              placeholder="<assistant-id>"
              value={assistantId}
              onChange={(e) => setAssistantId(e.target.value)}
            />
          </div>

          {/* API Keys Section */}
          <div className="pt-2">
            <Label className="text-base font-semibold mb-3 block">
              API Keys
            </Label>
            <p className="text-sm text-muted-foreground mb-3">
              Enable one API key to use. Click &quot;Verify&quot; to verify
              the key and load available models.
            </p>
            <div className="grid gap-3">
              <ApiKeyField
                id="openaiApiKey"
                provider="openai"
                label="OpenAI API Key"
                placeholder="sk-..."
                value={openaiApiKey}
                onChange={setOpenaiApiKey}
                isActive={activeProvider === "openai"}
                onToggle={() => handleToggleProvider("openai")}
                models={openaiModels}
                selectedModel={selectedModels.openai || ""}
                onModelSelect={(model) => setSelectedModelForProvider("openai", model)}
                onValidate={() => handleValidate("openai")}
                isValidating={validatingProvider === "openai"}
                validationStatus={validationStatus["openai"] || "idle"}
                validationError={validationErrors["openai"]}
                showModelSelect={true}
              />
              <ApiKeyField
                id="anthropicApiKey"
                provider="anthropic"
                label="Anthropic API Key"
                placeholder="sk-ant-..."
                value={anthropicApiKey}
                onChange={setAnthropicApiKey}
                isActive={activeProvider === "anthropic"}
                onToggle={() => handleToggleProvider("anthropic")}
                models={anthropicModels}
                selectedModel={selectedModels.anthropic || ""}
                onModelSelect={(model) => setSelectedModelForProvider("anthropic", model)}
                onValidate={() => handleValidate("anthropic")}
                isValidating={validatingProvider === "anthropic"}
                validationStatus={validationStatus["anthropic"] || "idle"}
                validationError={validationErrors["anthropic"]}
                showModelSelect={true}
              />
              <ApiKeyField
                id="googleApiKey"
                provider="google"
                label="Google API Key"
                placeholder="AIza..."
                value={googleApiKey}
                onChange={setGoogleApiKey}
                isActive={activeProvider === "google"}
                onToggle={() => handleToggleProvider("google")}
                models={googleModels}
                selectedModel={selectedModels.google || ""}
                onModelSelect={(model) => setSelectedModelForProvider("google", model)}
                onValidate={() => handleValidate("google")}
                isValidating={validatingProvider === "google"}
                validationStatus={validationStatus["google"] || "idle"}
                validationError={validationErrors["google"]}
                showModelSelect={true}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
