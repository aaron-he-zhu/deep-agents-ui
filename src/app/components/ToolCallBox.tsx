"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  ChevronDown,
  ChevronUp,
  Terminal,
  AlertCircle,
  Loader2,
  CircleCheckBigIcon,
  StopCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolCall, ActionRequest, ReviewConfig } from "@/app/types/types";
import { cn } from "@/lib/utils";
import { LoadExternalComponent } from "@langchain/langgraph-sdk/react-ui";
import { ToolApprovalInterrupt } from "@/app/components/ToolApprovalInterrupt";

interface ToolCallBoxProps {
  toolCall: ToolCall;
  uiComponent?: any;
  stream?: any;
  graphId?: string;
  actionRequest?: ActionRequest;
  reviewConfig?: ReviewConfig;
  onResume?: (value: any) => void;
  isLoading?: boolean;
}

export const ToolCallBox = React.memo<ToolCallBoxProps>(
  ({
    toolCall,
    uiComponent,
    stream,
    graphId,
    actionRequest,
    reviewConfig,
    onResume,
    isLoading,
  }) => {
    const [isExpanded, setIsExpanded] = useState(
      () => !!uiComponent || !!actionRequest
    );
    const [expandedArgs, setExpandedArgs] = useState<Record<string, boolean>>(
      {}
    );

    const { name, args, result, status } = useMemo(() => {
      return {
        name: toolCall.name || "Unknown Tool",
        args: toolCall.args || {},
        result: toolCall.result,
        status: toolCall.status || "completed",
      };
    }, [toolCall]);

    // Get summary for specific tools to display inline
    const toolSummary = useMemo(() => {
      const toolArgs = toolCall.args || {};
      switch (toolCall.name) {
        case "write_file":
        case "read_file":
        case "edit_file":
        case "ls":
        case "glob":
        case "grep":
          return toolArgs.path || toolArgs.file_path || toolArgs.filename || toolArgs.directory || null;
        case "fetch_url":
          return toolArgs.url || null;
        case "serp_search":
        case "serpapi_search":
        case "exa_search":
        case "tavily_search":
        case "tavily_crawl":
        case "perplexity_search":
        case "perplexity_chat":
          return toolArgs.query || toolArgs.q || toolArgs.message || toolArgs.messages?.[0]?.content || null;
        case "write_todos": {
          const todos = toolArgs.todos as Array<{ status?: string }> | undefined;
          if (todos && Array.isArray(todos)) {
            const completed = todos.filter(t => t.status === "completed").length;
            const total = todos.length;
            return `(${completed}/${total})`;
          }
          return null;
        }
        default:
          return null;
      }
    }, [toolCall]);

    const statusIcon = useMemo(() => {
      switch (status) {
        case "completed":
          return (
            <CircleCheckBigIcon
              size={14}
              className="text-emerald-500"
            />
          );
        case "error":
          return (
            <AlertCircle
              size={14}
              className="text-destructive"
            />
          );
        case "pending":
          return (
            <Loader2
              size={14}
              className="text-amber-500 animate-spin"
            />
          );
        case "interrupted":
          return (
            <StopCircle
              size={14}
              className="text-orange-500"
            />
          );
        default:
          return (
            <Terminal
              size={14}
              className="text-muted-foreground/50"
            />
          );
      }
    }, [status]);

    const toggleExpanded = useCallback(() => {
      setIsExpanded((prev) => !prev);
    }, []);

    const toggleArgExpanded = useCallback((argKey: string) => {
      setExpandedArgs((prev) => ({
        ...prev,
        [argKey]: !prev[argKey],
      }));
    }, []);

    const hasContent = result || Object.keys(args).length > 0;

    return (
      <div
        className={cn(
          "w-full overflow-hidden rounded-lg border-none shadow-none outline-none transition-colors duration-200 hover:bg-accent",
          isExpanded && hasContent && "bg-accent"
        )}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleExpanded}
          className={cn(
            "flex w-full items-center gap-2 border-none px-3 py-2 text-left shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-default justify-start"
          )}
          disabled={!hasContent}
        >
          <div className="flex items-center gap-2 shrink-0">
            {statusIcon}
            <span className="text-[15px] font-medium tracking-[-0.6px] text-foreground">
              {name}
            </span>
          </div>
          {toolSummary && (
            <span className="flex-1 text-[13px] text-muted-foreground truncate min-w-0">
              {toolSummary}
            </span>
          )}
          {hasContent &&
            (isExpanded ? (
              <ChevronUp
                size={14}
                className="shrink-0 text-muted-foreground ml-auto"
              />
            ) : (
              <ChevronDown
                size={14}
                className="shrink-0 text-muted-foreground ml-auto"
              />
            ))}
        </Button>

        {isExpanded && hasContent && (
          <div className="px-4 pb-4">
            {uiComponent && stream && graphId ? (
              <div className="mt-4">
                <LoadExternalComponent
                  key={uiComponent.id}
                  stream={stream}
                  message={uiComponent}
                  namespace={graphId}
                  meta={{ status, args, result: result ?? "No Result Yet" }}
                />
              </div>
            ) : actionRequest && onResume ? (
              // Show tool approval UI when there's an action request but no GenUI
              <div className="mt-4">
                <ToolApprovalInterrupt
                  actionRequest={actionRequest}
                  reviewConfig={reviewConfig}
                  onResume={onResume}
                  isLoading={isLoading}
                />
              </div>
            ) : (
              <>
                {Object.keys(args).length > 0 && (
                  <div className="mt-4">
                    <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Arguments
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(args).map(([key, value]) => (
                        <div
                          key={key}
                          className="rounded-sm border border-border"
                        >
                          <button
                            onClick={() => toggleArgExpanded(key)}
                            className="flex w-full items-center justify-between bg-muted/30 p-2 text-left text-xs font-medium transition-colors hover:bg-muted/50"
                          >
                            <span className="font-mono">{key}</span>
                            {expandedArgs[key] ? (
                              <ChevronUp
                                size={12}
                                className="text-muted-foreground"
                              />
                            ) : (
                              <ChevronDown
                                size={12}
                                className="text-muted-foreground"
                              />
                            )}
                          </button>
                          {expandedArgs[key] && (
                            <div className="border-t border-border bg-muted/20 p-2">
                              <pre className="m-0 overflow-x-auto whitespace-pre-wrap break-all font-mono text-xs leading-6 text-foreground">
                                {typeof value === "string"
                                  ? value
                                  : JSON.stringify(value, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {result && (
                  <div className="mt-4">
                    <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Result
                    </h4>
                    <pre className="m-0 overflow-x-auto whitespace-pre-wrap break-all rounded-sm border border-border bg-muted/40 p-2 font-mono text-xs leading-7 text-foreground">
                      {typeof result === "string"
                        ? result
                        : JSON.stringify(result, null, 2)}
                    </pre>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    );
  }
);

ToolCallBox.displayName = "ToolCallBox";
