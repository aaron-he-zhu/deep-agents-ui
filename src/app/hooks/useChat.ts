"use client";

import { useCallback, useMemo } from "react";
import { useStream } from "@langchain/langgraph-sdk/react";
import {
  type Message,
  type Assistant,
  type Checkpoint,
} from "@langchain/langgraph-sdk";
import { v4 as uuidv4 } from "uuid";
import type { UseStreamThread } from "@langchain/langgraph-sdk/react";
import type { TodoItem } from "@/app/types/types";
import { useClient, useActiveProvider } from "@/providers/ClientProvider";
import { useQueryState } from "nuqs";
import { getAuthScheme } from "@/lib/config";

export interface Suggestion {
  short: string;
  full: string;
}

export type StateType = {
  messages: Message[];
  todos: TodoItem[];
  files: Record<string, string>;
  email?: {
    id?: string;
    subject?: string;
    page_content?: string;
  };
  ui?: any;
  suggestions?: Suggestion[];
};

export function useChat({
  activeAssistant,
  onHistoryRevalidate,
  thread,
}: {
  activeAssistant: Assistant | null;
  onHistoryRevalidate?: () => void;
  thread?: UseStreamThread<StateType>;
}) {
  const [threadId, setThreadId] = useQueryState("threadId");
  const client = useClient();
  const activeProvider = useActiveProvider();
  
  const authScheme = useMemo(() => getAuthScheme(activeProvider), [activeProvider]);

  const stream = useStream<StateType>({
    assistantId: activeAssistant?.assistant_id || "",
    client: client ?? undefined,
    reconnectOnMount: true,
    threadId: threadId ?? null,
    onThreadId: setThreadId,
    defaultHeaders: { "x-auth-scheme": authScheme },
    // Revalidate thread list when stream finishes, errors, or creates new thread
    onFinish: onHistoryRevalidate,
    onError: onHistoryRevalidate,
    onCreated: onHistoryRevalidate,
    experimental_thread: thread,
  });

  const sendMessage = useCallback(
    (content: string) => {
      const newMessage: Message = { id: uuidv4(), type: "human", content };
      
      // Get model config from localStorage
      const savedConfig = localStorage.getItem("standalone-config");
      let modelConfig: Record<string, any> = {};
      if (savedConfig) {
        try {
          const config = JSON.parse(savedConfig);
          const provider = config.activeProvider;
          const model = config.selectedModels?.[provider] || config.selectedModel;
          if (provider && model) {
            modelConfig = {
              provider,
              model,
              // Pass API keys based on provider
              ...(provider === "openai" && config.openaiApiKey ? { openai_api_key: config.openaiApiKey } : {}),
              ...(provider === "anthropic" && config.anthropicApiKey ? { anthropic_api_key: config.anthropicApiKey } : {}),
              ...(provider === "google" && config.googleApiKey ? { google_api_key: config.googleApiKey } : {}),
              ...(provider === "openrouter" && config.openRouterConfig?.apiKey ? { 
                openai_api_key: config.openRouterConfig.apiKey,
                openai_base_url: config.openRouterConfig.baseUrl,
              } : {}),
              // Pass model overrides for suggestions and other components
              ...(config.modelOverrides ? { model_overrides: config.modelOverrides } : {}),
            };
            
            // Log model configuration for debugging
            console.log("[MODEL CONFIG] Sending to backend:", {
              provider,
              model,
              hasApiKey: !!(modelConfig.openai_api_key || modelConfig.anthropic_api_key || modelConfig.google_api_key),
              hasBaseUrl: !!modelConfig.openai_base_url,
              modelOverrides: config.modelOverrides || null,
            });
          }
        } catch (e) {
          console.warn("Failed to parse config:", e);
        }
      } else {
        console.log("[MODEL CONFIG] No saved config found, using defaults");
      }
      
      stream.submit(
        { messages: [newMessage] },
        {
          optimisticValues: (prev) => ({
            messages: [...(prev.messages ?? []), newMessage],
          }),
          config: { 
            ...(activeAssistant?.config ?? {}), 
            recursion_limit: 100,
            configurable: modelConfig,
          },
        }
      );
      // Update thread list immediately when sending a message
      onHistoryRevalidate?.();
    },
    [stream, activeAssistant?.config, onHistoryRevalidate]
  );

  const runSingleStep = useCallback(
    (
      messages: Message[],
      checkpoint?: Checkpoint,
      isRerunningSubagent?: boolean,
      optimisticMessages?: Message[]
    ) => {
      if (checkpoint) {
        stream.submit(undefined, {
          ...(optimisticMessages
            ? { optimisticValues: { messages: optimisticMessages } }
            : {}),
          config: activeAssistant?.config,
          checkpoint: checkpoint,
          ...(isRerunningSubagent
            ? { interruptAfter: ["tools"] }
            : { interruptBefore: ["tools"] }),
        });
      } else {
        stream.submit(
          { messages },
          { config: activeAssistant?.config, interruptBefore: ["tools"] }
        );
      }
    },
    [stream, activeAssistant?.config]
  );

  const setFiles = useCallback(
    async (files: Record<string, string>) => {
      if (!threadId) return;
      // TODO: missing a way how to revalidate the internal state
      // I think we do want to have the ability to externally manage the state
      await client.threads.updateState(threadId, { values: { files } });
    },
    [client, threadId]
  );

  const continueStream = useCallback(
    (hasTaskToolCall?: boolean) => {
      stream.submit(undefined, {
        config: {
          ...(activeAssistant?.config || {}),
          recursion_limit: 100,
        },
        ...(hasTaskToolCall
          ? { interruptAfter: ["tools"] }
          : { interruptBefore: ["tools"] }),
      });
      // Update thread list when continuing stream
      onHistoryRevalidate?.();
    },
    [stream, activeAssistant?.config, onHistoryRevalidate]
  );

  const markCurrentThreadAsResolved = useCallback(() => {
    stream.submit(null, { command: { goto: "__end__", update: null } });
    // Update thread list when marking thread as resolved
    onHistoryRevalidate?.();
  }, [stream, onHistoryRevalidate]);

  const resumeInterrupt = useCallback(
    (value: any) => {
      stream.submit(null, { command: { resume: value } });
      // Update thread list when resuming from interrupt
      onHistoryRevalidate?.();
    },
    [stream, onHistoryRevalidate]
  );

  const stopStream = useCallback(() => {
    stream.stop();
  }, [stream]);

  return {
    stream,
    todos: stream.values.todos ?? [],
    files: stream.values.files ?? {},
    email: stream.values.email,
    ui: stream.values.ui,
    suggestions: stream.values.suggestions ?? [],
    setFiles,
    messages: stream.messages,
    isLoading: stream.isLoading,
    isThreadLoading: stream.isThreadLoading,
    interrupt: stream.interrupt,
    getMessagesMetadata: stream.getMessagesMetadata,
    sendMessage,
    runSingleStep,
    continueStream,
    stopStream,
    markCurrentThreadAsResolved,
    resumeInterrupt,
  };
}
