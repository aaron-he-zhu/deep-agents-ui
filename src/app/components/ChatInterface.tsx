"use client";

import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  FormEvent,
  useEffect,
} from "react";
import { Button } from "@/components/ui/button";
import {
  Square,
  ArrowUp,
  MessagesSquare,
  MessageCircle,
  Copy,
  Plus,
  Check,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import { ChatMessage } from "@/app/components/ChatMessage";
import type { ToolCall, ActionRequest, ReviewConfig } from "@/app/types/types";
import { Assistant, Message } from "@langchain/langgraph-sdk";
import {
  extractStringFromMessageContent,
  formatConversationForLLM,
} from "@/app/utils/utils";
import { useChatContext } from "@/providers/ChatProvider";
import { cn } from "@/lib/utils";
import { useStickToBottom } from "use-stick-to-bottom";
import { ThreadsOverlay } from "@/app/components/ThreadsOverlay";
import { useQueryState } from "nuqs";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useSuggestions } from "@/app/hooks/useSuggestions";

interface ChatInterfaceProps {
  assistant: Assistant | null;
}

export const ChatInterface = React.memo<ChatInterfaceProps>(({ assistant }) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const threadsButtonRef = useRef<HTMLButtonElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const [, setThreadId] = useQueryState("threadId");
  const [threadsOverlayOpen, setThreadsOverlayOpen] = useState(false);
  const [interruptCount, setInterruptCount] = useState(0);
  const [chatContainerHeight, setChatContainerHeight] = useState(0);
  const [copySuccess, setCopySuccess] = useState(false);

  const [input, setInput] = useState("");
  const [visibleSuggestions, setVisibleSuggestions] = useState(4);
  const [threadId] = useQueryState("threadId");
  const { scrollRef, contentRef } = useStickToBottom();

  // Get chat context first
  const {
    stream,
    messages,
    ui,
    isLoading,
    isThreadLoading,
    interrupt,
    sendMessage,
    stopStream,
    resumeInterrupt,
    suggestions: agentSuggestions,
  } = useChatContext();

  // Track if main AI response is complete (even if suggestions are still generating)
  // This allows the UI to become interactive sooner
  const lastMessageContentRef = useRef<string>("");
  const stableCountRef = useRef(0);
  const [isMainResponseComplete, setIsMainResponseComplete] = useState(false);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);

  // Detect when the main AI response is complete by monitoring content changes
  useEffect(() => {
    if (!isLoading) {
      // Reset when loading is complete
      setIsMainResponseComplete(false);
      setIsGeneratingSuggestions(false);
      stableCountRef.current = 0;
      lastMessageContentRef.current = "";
      return;
    }

    // Find the last AI message
    const lastAIMessage = messages.filter(m => m.type === "ai").pop();
    if (!lastAIMessage) {
      stableCountRef.current = 0;
      return;
    }

    const currentContent = extractStringFromMessageContent(lastAIMessage);
    
    // If content hasn't changed and has meaningful length
    if (currentContent === lastMessageContentRef.current && currentContent.length > 100) {
      stableCountRef.current++;
    } else {
      // Content changed, reset counter
      stableCountRef.current = 0;
      lastMessageContentRef.current = currentContent;
    }
  }, [isLoading, messages]);
  
  // Use a separate effect with a timer to check stability
  useEffect(() => {
    if (!isLoading || isMainResponseComplete) return;
    
    const timer = setTimeout(() => {
      // If we have stable content for 500ms (5 ticks @ ~100ms per message update)
      if (stableCountRef.current >= 3 && lastMessageContentRef.current.length > 100) {
        console.log("Main response detected as complete, UI can be interactive now");
        setIsMainResponseComplete(true);
        setIsGeneratingSuggestions(true);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [isLoading, messages, isMainResponseComplete]);

  // Use dynamic suggestions hook (after useChatContext)
  // Pass agent suggestions from SuggestionsMiddleware if available
  const { suggestions: allSuggestions, isRefreshing } = useSuggestions({
    threadId,
    messages,
    isLoading: isLoading || false,
    agentSuggestions,
  });

  // Determine if user can interact - either not loading OR main response is complete
  const canInteract = !isLoading || isMainResponseComplete;
  const showLoadingState = isLoading && !isMainResponseComplete;
  const submitDisabled = showLoadingState || !assistant;

  // Track chat container height for overlay
  useEffect(() => {
    const updateHeight = () => {
      if (chatContainerRef.current) {
        setChatContainerHeight(chatContainerRef.current.offsetHeight);
      }
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  const handleSubmit = useCallback(
    (e?: FormEvent) => {
      if (e) {
        e.preventDefault();
      }
      const messageText = input.trim();
      if (!messageText || showLoadingState || submitDisabled) return;
      sendMessage(messageText);
      setInput("");
    },
    [input, showLoadingState, sendMessage, setInput, submitDisabled]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (submitDisabled) return;
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit, submitDisabled]
  );

  const handleThreadSelect = useCallback(
    async (id: string) => {
      await setThreadId(id);
    },
    [setThreadId]
  );

  const handleNewChat = useCallback(async () => {
    await setThreadId(null);
  }, [setThreadId]);

  // Reset input and visible suggestions count when thread changes
  useEffect(() => {
    setInput("");
    setVisibleSuggestions(4);
  }, [threadId]);

  // Handle suggestion click - use full prompt
  const handleSuggestionClick = useCallback((fullPrompt: string) => {
    setInput(fullPrompt);
    textareaRef.current?.focus();
  }, []);

  // Show more suggestions
  const handleShowMore = useCallback(() => {
    setVisibleSuggestions((prev) => Math.min(prev + 4, 20));
  }, []);

  // Reset visible suggestions when thread changes or suggestions refresh
  const prevIsRefreshingRef = useRef(isRefreshing);
  useEffect(() => {
    if (!prevIsRefreshingRef.current && isRefreshing) {
      // Suggestions are being refreshed, reset visible count
      setVisibleSuggestions(4);
    }
    prevIsRefreshingRef.current = isRefreshing;
  }, [isRefreshing]);

  // Copy chat to markdown (includes tool calls and results)
  const handleCopyChat = useCallback(async () => {
    const markdownContent = formatConversationForLLM(messages);

    try {
      await navigator.clipboard.writeText(markdownContent);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [messages]);

  const processedMessages = useMemo(() => {
    const messageMap = new Map<
      string,
      { message: Message; toolCalls: ToolCall[] }
    >();
    messages.forEach((message: Message) => {
      if (message.type === "ai") {
        const toolCallsInMessage: Array<{
          id?: string;
          function?: { name?: string; arguments?: unknown };
          name?: string;
          type?: string;
          args?: unknown;
          input?: unknown;
        }> = [];
        if (
          message.additional_kwargs?.tool_calls &&
          Array.isArray(message.additional_kwargs.tool_calls)
        ) {
          toolCallsInMessage.push(...message.additional_kwargs.tool_calls);
        } else if (message.tool_calls && Array.isArray(message.tool_calls)) {
          toolCallsInMessage.push(
            ...message.tool_calls.filter(
              (toolCall: { name?: string }) => toolCall.name !== ""
            )
          );
        } else if (Array.isArray(message.content)) {
          const toolUseBlocks = message.content.filter(
            (block: { type?: string }) => block.type === "tool_use"
          );
          toolCallsInMessage.push(...toolUseBlocks);
        }
        const toolCallsWithStatus = toolCallsInMessage.map(
          (toolCall: {
            id?: string;
            function?: { name?: string; arguments?: unknown };
            name?: string;
            type?: string;
            args?: unknown;
            input?: unknown;
          }) => {
            const name =
              toolCall.function?.name ||
              toolCall.name ||
              toolCall.type ||
              "unknown";
            const args =
              toolCall.function?.arguments ||
              toolCall.args ||
              toolCall.input ||
              {};
            return {
              id: toolCall.id || `tool-${Math.random()}`,
              name,
              args,
              status: interrupt ? "interrupted" : ("pending" as const),
            } as ToolCall;
          }
        );
        messageMap.set(message.id!, {
          message,
          toolCalls: toolCallsWithStatus,
        });
      } else if (message.type === "tool") {
        const toolCallId = message.tool_call_id;
        if (!toolCallId) {
          return;
        }
        for (const [, data] of messageMap.entries()) {
          const toolCallIndex = data.toolCalls.findIndex(
            (tc: ToolCall) => tc.id === toolCallId
          );
          if (toolCallIndex === -1) {
            continue;
          }
          data.toolCalls[toolCallIndex] = {
            ...data.toolCalls[toolCallIndex],
            status: "completed" as const,
            result: extractStringFromMessageContent(message),
          };
          break;
        }
      } else if (message.type === "human") {
        messageMap.set(message.id!, {
          message,
          toolCalls: [],
        });
      }
    });
    const processedArray = Array.from(messageMap.values());
    return processedArray.map((data, index) => {
      const prevMessage = index > 0 ? processedArray[index - 1].message : null;
      return {
        ...data,
        showAvatar: data.message.type !== prevMessage?.type,
      };
    });
  }, [messages, interrupt]);

  const actionRequestsMap: Map<string, ActionRequest> | null = useMemo(() => {
    const actionRequests =
      interrupt?.value && (interrupt.value as any)["action_requests"];
    if (!actionRequests) return new Map<string, ActionRequest>();
    return new Map(actionRequests.map((ar: ActionRequest) => [ar.name, ar]));
  }, [interrupt]);

  const reviewConfigsMap: Map<string, ReviewConfig> | null = useMemo(() => {
    const reviewConfigs =
      interrupt?.value && (interrupt.value as any)["review_configs"];
    if (!reviewConfigs) return new Map<string, ReviewConfig>();
    return new Map(
      reviewConfigs.map((rc: ReviewConfig) => [rc.actionName, rc])
    );
  }, [interrupt]);

  return (
    <>
      <div className="flex flex-1 flex-col overflow-hidden p-2">
        {/* Chat container with border */}
        <div
          ref={chatContainerRef}
          className="flex flex-1 flex-col overflow-hidden rounded-xl border border-border bg-background"
        >
          {/* Top border with Chat label on left and buttons on right */}
          <div className="flex h-12 flex-shrink-0 items-center justify-between border-b border-border bg-muted/30 px-4">
            {/* Left: Chat label */}
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <MessageCircle size={16} />
              <span>Chat</span>
            </div>

            {/* Right: Copy, All Chats, +New Chat buttons */}
            <div className="flex items-center gap-1">
              {/* Copy Chat button with text */}
              <button
                type="button"
                onClick={handleCopyChat}
                disabled={messages.length === 0}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50 disabled:hover:bg-transparent"
                title="Copy chat as Markdown"
              >
                {copySuccess ? (
                  <Check size={16} className="text-green-500" />
                ) : (
                  <Copy size={16} />
                )}
                <span>Copy All</span>
              </button>

              {/* All Chats button */}
              <button
                ref={threadsButtonRef}
                type="button"
                onClick={() => setThreadsOverlayOpen(true)}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <MessagesSquare size={16} />
                <span>All Chats</span>
                {interruptCount > 0 && (
                  <span className="inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] text-destructive-foreground">
                    {interruptCount}
                  </span>
                )}
              </button>

              {/* +New Chat button */}
              <button
                type="button"
                onClick={handleNewChat}
                className="flex h-8 items-center gap-1.5 rounded-md bg-[#2F6868] px-3 text-sm text-white transition-colors hover:bg-[#2F6868]/80"
              >
                <Plus size={16} />
                <span>New Chat</span>
              </button>
            </div>
          </div>

          {/* Resizable Chat and Input areas */}
          <ResizablePanelGroup
            direction="vertical"
            autoSaveId="chat-input-layout-v3"
            className="flex-1"
          >
            {/* Messages area */}
            <ResizablePanel
              id="messages"
              order={1}
              defaultSize={75}
              minSize={20}
              className="group/chat flex flex-col"
            >
              <div
                className="scrollbar-auto-hide flex-1 overflow-y-auto overflow-x-hidden overscroll-contain"
                ref={scrollRef}
              >
                <div
                  className="mx-auto w-full max-w-[1024px] px-6 pb-6 pt-4"
                  ref={contentRef}
                >
                  {isThreadLoading ? (
                    <div className="flex items-center justify-center p-8">
                      <p className="text-muted-foreground">Loading...</p>
                    </div>
                  ) : (
                    <>
                      {processedMessages.map((data, index) => {
                        const messageUi = ui?.filter(
                          (u: any) => u.metadata?.message_id === data.message.id
                        );
                        const isLastMessage =
                          index === processedMessages.length - 1;
                        return (
                          <ChatMessage
                            key={data.message.id}
                            message={data.message}
                            toolCalls={data.toolCalls}
                            isLoading={isLoading}
                            actionRequestsMap={
                              isLastMessage ? actionRequestsMap : undefined
                            }
                            reviewConfigsMap={
                              isLastMessage ? reviewConfigsMap : undefined
                            }
                            ui={messageUi}
                            stream={stream}
                            onResumeInterrupt={resumeInterrupt}
                            graphId={assistant?.graph_id}
                          />
                        );
                      })}
                    </>
                  )}
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Input area - default ~200px (25%), min ~200px, max 80% */}
            <ResizablePanel
              id="input"
              order={2}
              defaultSize={25}
              minSize={15}
              maxSize={80}
              className="flex min-h-[200px] flex-col"
            >
              <div className="flex flex-1 flex-col bg-background px-4 pb-4 pt-2">
                <form
                  onSubmit={handleSubmit}
                  className={cn(
                    "flex flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card",
                    "transition-colors duration-200 ease-in-out"
                  )}
                >
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      showLoadingState ? "Running..." : 
                      isGeneratingSuggestions ? "Generating suggestions..." :
                      "Write your message..."
                    }
                    className="font-inherit flex-1 resize-none border-0 bg-transparent px-[18px] py-3 text-sm leading-6 text-primary outline-none placeholder:text-tertiary"
                  />
                  <div className="flex flex-shrink-0 items-end justify-between gap-2 px-3 pb-3">
                    {/* Suggestion prompts - left side */}
                    <div
                      className={cn(
                        "flex flex-wrap items-center gap-1.5",
                        isRefreshing && "animate-pulse"
                      )}
                    >
                      {allSuggestions.slice(0, visibleSuggestions).map((suggestion, index) => (
                        <button
                          key={`${suggestion.short}-${index}`}
                          type="button"
                          onClick={() => handleSuggestionClick(suggestion.full)}
                          disabled={showLoadingState}
                          title={suggestion.full}
                          className={cn(
                            "rounded-full border border-border bg-background px-2.5 py-0.5 text-[11px] text-muted-foreground",
                            "transition-all duration-200 hover:border-primary/50 hover:bg-accent hover:text-foreground",
                            "disabled:opacity-50 disabled:cursor-not-allowed",
                            isRefreshing && "animate-in fade-in slide-in-from-left-2 duration-300"
                          )}
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          {suggestion.short}
                        </button>
                      ))}
                      {visibleSuggestions < 20 && allSuggestions.length > visibleSuggestions && (
                        <button
                          type="button"
                          onClick={handleShowMore}
                          disabled={showLoadingState}
                          className={cn(
                            "flex items-center gap-0.5 rounded-full border border-dashed border-border px-2 py-0.5 text-[11px] text-muted-foreground",
                            "transition-colors hover:border-primary/50 hover:text-foreground",
                            "disabled:opacity-50 disabled:cursor-not-allowed"
                          )}
                        >
                          <span>More</span>
                          <ChevronRight size={10} />
                        </button>
                      )}
                      {isRefreshing && (
                        <RefreshCw size={12} className="animate-spin text-muted-foreground" />
                      )}
                    </div>

                    {/* Send button - right side */}
                    <Button
                      type={showLoadingState ? "button" : "submit"}
                      variant={showLoadingState ? "destructive" : "default"}
                      onClick={showLoadingState ? stopStream : handleSubmit}
                      disabled={!showLoadingState && (submitDisabled || !input.trim())}
                    >
                      {showLoadingState ? (
                        <>
                          <Square size={14} />
                          <span>Stop</span>
                        </>
                      ) : (
                        <>
                          <ArrowUp size={18} />
                          <span>Send</span>
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>

      {/* Threads Overlay - positioned as dropdown from All Chats button */}
      <ThreadsOverlay
        isOpen={threadsOverlayOpen}
        onClose={() => setThreadsOverlayOpen(false)}
        onThreadSelect={handleThreadSelect}
        onInterruptCountChange={setInterruptCount}
        anchorRef={threadsButtonRef}
        chatContainerHeight={chatContainerHeight}
      />
    </>
  );
});

ChatInterface.displayName = "ChatInterface";
