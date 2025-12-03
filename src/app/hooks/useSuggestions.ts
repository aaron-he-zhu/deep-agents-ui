"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Message, Client } from "@langchain/langgraph-sdk";
import { extractStringFromMessageContent, formatConversationForLLM } from "@/app/utils/utils";
import { getConfig, getActiveApiKey } from "@/lib/config";

export interface Suggestion {
  short: string;
  full: string;
}

// Default suggestions when no context is available
const DEFAULT_SUGGESTIONS: Suggestion[] = [
  {
    short: "Research this",
    full: "Please help me conduct thorough research on this topic. I'd like you to explore multiple perspectives, gather relevant data and statistics, identify key experts and sources, and provide a comprehensive overview of the current state of knowledge in this area."
  },
  {
    short: "Summarize points",
    full: "Please summarize the key points from our conversation so far. Highlight the most important insights, decisions made, action items identified, and any outstanding questions that still need to be addressed. Organize the summary in a clear and structured format."
  },
  {
    short: "Next steps",
    full: "Based on our discussion, what are the recommended next steps I should take? Please provide a prioritized list of actions with clear explanations for each, including any dependencies, estimated effort, and potential risks or considerations I should be aware of."
  },
  {
    short: "Explain details",
    full: "Please explain this concept in more detail. Break it down into simpler components, provide relevant examples and analogies, clarify any technical terms, and help me understand both the fundamentals and the nuances of this topic."
  },
  {
    short: "Create plan",
    full: "Help me create a comprehensive plan for this project or goal. Include clear objectives, milestones, timelines, resource requirements, potential challenges and mitigation strategies, and success metrics. Structure the plan in phases if appropriate."
  },
  {
    short: "Find related",
    full: "Please help me find related information, resources, and connections to this topic. Identify relevant articles, studies, tools, communities, or experts that could provide additional insights. Explain how each resource relates to my current needs."
  },
  {
    short: "Compare options",
    full: "Please compare the different options or approaches we've discussed. Create a structured comparison covering pros and cons, costs and benefits, risks and opportunities, and provide a recommendation based on the specific criteria and constraints of my situation."
  },
  {
    short: "Generate ideas",
    full: "Help me brainstorm and generate creative ideas for this challenge. Think outside the box, consider unconventional approaches, draw inspiration from different domains, and provide a diverse range of options from practical to innovative solutions."
  },
  {
    short: "Review improve",
    full: "Please review what we have so far and suggest improvements. Identify areas that could be strengthened, point out any gaps or inconsistencies, recommend specific enhancements, and help me elevate the quality and effectiveness of this work."
  },
  {
    short: "Key questions",
    full: "What are the most important questions I should be asking about this topic or situation? Help me identify blind spots, critical considerations I might have missed, and the key inquiries that will lead to better understanding and decision-making."
  },
  {
    short: "Identify issues",
    full: "Please help me identify potential issues, risks, or problems that could arise. Consider technical, practical, and strategic perspectives. For each issue identified, suggest possible mitigation strategies or preventive measures I could implement."
  },
  {
    short: "Best practices",
    full: "What are the industry best practices and proven approaches for this type of situation? Share relevant frameworks, methodologies, and lessons learned from successful implementations. Help me understand what separates good execution from great execution."
  },
];

// LocalStorage key for suggestions cache
const SUGGESTIONS_CACHE_KEY = "deep-agent-suggestions-cache";

// Helper to get cached suggestions from localStorage
function getCachedSuggestions(cacheKey: string): Suggestion[] | null {
  if (typeof window === "undefined") return null;
  try {
    const cached = localStorage.getItem(SUGGESTIONS_CACHE_KEY);
    if (!cached) return null;
    const cacheMap = JSON.parse(cached) as Record<string, Suggestion[]>;
    return cacheMap[cacheKey] || null;
  } catch {
    return null;
  }
}

// Helper to save suggestions to localStorage cache
function saveSuggestionsToCache(cacheKey: string, suggestions: Suggestion[]): void {
  if (typeof window === "undefined") return;
  try {
    const cached = localStorage.getItem(SUGGESTIONS_CACHE_KEY);
    const cacheMap: Record<string, Suggestion[]> = cached ? JSON.parse(cached) : {};
    cacheMap[cacheKey] = suggestions;
    
    // Limit cache size to prevent localStorage from growing too large (keep last 50 entries)
    const keys = Object.keys(cacheMap);
    if (keys.length > 50) {
      const keysToRemove = keys.slice(0, keys.length - 50);
      keysToRemove.forEach(key => delete cacheMap[key]);
    }
    
    localStorage.setItem(SUGGESTIONS_CACHE_KEY, JSON.stringify(cacheMap));
  } catch (error) {
    console.warn("Failed to save suggestions to cache:", error);
  }
}

interface UseSuggestionsProps {
  threadId: string | null;
  messages: Message[];
  isLoading: boolean;
}

// System prompt for generating suggestions
const SUGGESTION_SYSTEM_PROMPT = `You are a helpful assistant that generates follow-up question suggestions based on a conversation context.

Given the conversation history, generate exactly 12 contextually relevant follow-up prompts that the user might want to ask next.

For each suggestion, provide:
1. "short": A very brief label (2-4 words max) that summarizes the prompt
2. "full": A detailed, complete prompt (MUST be at least 20 words, ideally 25-40 words) that the user can use directly

IMPORTANT: Each "full" prompt MUST contain at least 20 words. Make them specific, detailed, and actionable.

The suggestions should:
- Be directly relevant to the conversation context
- Cover different aspects and directions the conversation could go
- Be specific and actionable, not generic
- Help the user explore the topic deeper or take next steps

Respond ONLY with a valid JSON array of objects, no other text:
[{"short": "brief label", "full": "detailed prompt with at least 20 words..."}, ...]`;

export function useSuggestions({
  threadId,
  messages,
  isLoading,
}: UseSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>(DEFAULT_SUGGESTIONS);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const prevIsLoadingRef = useRef(isLoading);
  const lastMessageIdRef = useRef<string | null>(null);

  // Get the last AI message content for context
  const getLastAIMessageContext = useCallback(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].type === "ai") {
        return {
          id: messages[i].id,
          content: extractStringFromMessageContent(messages[i]),
        };
      }
    }
    return null;
  }, [messages]);

  // Generate suggestions using LLM via the deployment
  const generateSuggestionsWithLLM = useCallback(async (conversationContext: string): Promise<Suggestion[]> => {
    // Get config dynamically to ensure we have the latest values
    const config = getConfig();
    const apiKey = getActiveApiKey(config);
    const deploymentUrl = config?.deploymentUrl;

    if (!deploymentUrl || !apiKey) {
      console.warn("No deployment URL or API key, using defaults");
      return DEFAULT_SUGGESTIONS;
    }

    try {
      // Create a client to call the LLM
      const client = new Client({
        apiUrl: deploymentUrl,
        apiKey: apiKey,
      });

      // Create a temporary thread for suggestion generation
      const thread = await client.threads.create();
      
      // Prepare the prompt
      const userPrompt = `Based on this conversation, generate 12 contextually relevant follow-up prompts:

---
${conversationContext.slice(0, 3000)}
---

CRITICAL: Each "full" prompt MUST have at least 20 words. Make them detailed and specific to the conversation context.
Return ONLY a valid JSON array with "short" (2-4 words) and "full" (at least 20 words) for each suggestion.`;

      // Stream the response
      const streamResponse = client.runs.stream(thread.thread_id, "agent", {
        input: {
          messages: [
            { role: "system", content: SUGGESTION_SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
        },
        streamMode: "messages",
      });

      let fullResponse = "";
      
      for await (const event of streamResponse) {
        if (event.event === "messages/partial") {
          const msgs = event.data as Message[];
          if (msgs && msgs.length > 0) {
            const lastMsg = msgs[msgs.length - 1];
            if (lastMsg.type === "ai") {
              fullResponse = extractStringFromMessageContent(lastMsg);
            }
          }
        }
      }

      // Try to parse the JSON response
      if (fullResponse) {
        // Extract JSON from the response (handle markdown code blocks)
        let jsonStr = fullResponse;
        const jsonMatch = fullResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
          jsonStr = jsonMatch[1].trim();
        } else {
          // Try to find JSON array directly
          const arrayMatch = fullResponse.match(/\[[\s\S]*\]/);
          if (arrayMatch) {
            jsonStr = arrayMatch[0];
          }
        }

        try {
          const parsed = JSON.parse(jsonStr);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Validate and clean up suggestions
            const validSuggestions = parsed
              .filter((s: unknown) => 
                s && typeof s === 'object' && 
                'short' in s && 'full' in s &&
                typeof (s as Suggestion).short === 'string' && 
                typeof (s as Suggestion).full === 'string' &&
                // Ensure full prompt has at least 20 words
                (s as Suggestion).full.split(/\s+/).length >= 15 // Allow some tolerance
              )
              .slice(0, 12)
              .map((s: Suggestion) => ({
                short: s.short.slice(0, 30), // Limit short to 30 chars
                full: s.full,
              }));
            
            if (validSuggestions.length >= 3) {
              // Clean up the temporary thread
              try {
                await client.threads.delete(thread.thread_id);
              } catch {
                // Ignore cleanup errors
              }
              return validSuggestions;
            }
          }
        } catch (parseError) {
          console.warn("Failed to parse LLM suggestions response:", parseError);
        }
      }

      // Clean up the temporary thread
      try {
        await client.threads.delete(thread.thread_id);
      } catch {
        // Ignore cleanup errors
      }
    } catch (error) {
      console.warn("Error generating suggestions with LLM:", error);
    }

    // Fallback to defaults
    return DEFAULT_SUGGESTIONS;
  }, []);

  // Check cache and load suggestions
  const loadSuggestions = useCallback(async () => {
    const cacheKey = threadId || "new";
    const lastAIMessage = getLastAIMessageContext();

    // If no messages, use defaults
    if (!lastAIMessage || messages.length === 0) {
      setSuggestions(DEFAULT_SUGGESTIONS);
      return;
    }

    // Check if we already have cached suggestions for this message (localStorage)
    const cachedKey = `${cacheKey}_${lastAIMessage.id}`;
    const cachedSuggestions = getCachedSuggestions(cachedKey);
    if (cachedSuggestions) {
      console.log("Using cached suggestions for:", cachedKey);
      setSuggestions(cachedSuggestions);
      return;
    }

    // Generate new suggestions using LLM
    console.log("Generating new suggestions for:", cachedKey);
    setIsRefreshing(true);
    try {
      // Get full conversation context
      const conversationContext = formatConversationForLLM(messages);
      const newSuggestions = await generateSuggestionsWithLLM(conversationContext);
      
      // Save to localStorage cache
      saveSuggestionsToCache(cachedKey, newSuggestions);
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error("Failed to generate suggestions:", error);
      setSuggestions(DEFAULT_SUGGESTIONS);
    } finally {
      setIsRefreshing(false);
    }
  }, [threadId, messages, getLastAIMessageContext, generateSuggestionsWithLLM]);

  // Watch for loading state changes (agent finished responding)
  useEffect(() => {
    const wasLoading = prevIsLoadingRef.current;
    prevIsLoadingRef.current = isLoading;

    // Detect when loading transitions from true to false (agent finished)
    if (wasLoading && !isLoading && messages.length > 0) {
      const lastAIMessage = getLastAIMessageContext();
      
      // Only refresh if the last AI message changed AND not already cached
      if (lastAIMessage && lastAIMessage.id !== lastMessageIdRef.current) {
        const cacheKey = threadId || "new";
        const cachedKey = `${cacheKey}_${lastAIMessage.id}`;
        
        // Check cache first before triggering load
        const cachedSuggestions = getCachedSuggestions(cachedKey);
        if (cachedSuggestions) {
          console.log("Agent finished, using cached suggestions");
          setSuggestions(cachedSuggestions);
          lastMessageIdRef.current = lastAIMessage.id || null;
        } else {
          lastMessageIdRef.current = lastAIMessage.id || null;
          loadSuggestions();
        }
      }
    }
  }, [isLoading, messages.length, threadId, getLastAIMessageContext, loadSuggestions]);

  // Load cached suggestions when thread changes or messages are loaded
  useEffect(() => {
    const cacheKey = threadId || "new";
    const lastAIMessage = getLastAIMessageContext();
    
    if (lastAIMessage) {
      const cachedKey = `${cacheKey}_${lastAIMessage.id}`;
      
      // Check localStorage cache first
      const cachedSuggestions = getCachedSuggestions(cachedKey);
      if (cachedSuggestions) {
        console.log("Thread loaded, using cached suggestions");
        setSuggestions(cachedSuggestions);
        lastMessageIdRef.current = lastAIMessage.id || null;
        return;
      }
      
      // If not cached and we have messages, generate suggestions
      if (lastAIMessage.id !== lastMessageIdRef.current && !isLoading) {
        lastMessageIdRef.current = lastAIMessage.id || null;
        loadSuggestions();
        return;
      }
    }
    
    // Reset to defaults for new threads with no messages
    if (messages.length === 0) {
      setSuggestions(DEFAULT_SUGGESTIONS);
      lastMessageIdRef.current = null;
    }
  }, [threadId, messages.length, getLastAIMessageContext, isLoading, loadSuggestions]);

  return {
    suggestions,
    isRefreshing,
    refreshSuggestions: loadSuggestions,
  };
}
