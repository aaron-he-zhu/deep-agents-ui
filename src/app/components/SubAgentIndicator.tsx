"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { SubAgent } from "@/app/types/types";

interface SubAgentIndicatorProps {
  subAgent: SubAgent;
  taskSummary?: string;
  onClick: () => void;
  isExpanded?: boolean;
}

// Extract first line or first sentence as task summary
function getTaskSummary(content: string, maxLength: number = 60): string {
  if (!content) return "";
  // Get first line
  const firstLine = content.split("\n")[0].trim();
  // Remove markdown formatting
  const cleaned = firstLine.replace(/^#+\s*/, "").replace(/\*\*/g, "").trim();
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.slice(0, maxLength) + "...";
}

export const SubAgentIndicator = React.memo<SubAgentIndicatorProps>(
  ({ subAgent, taskSummary, onClick, isExpanded = false }) => {
    const summary = taskSummary ? getTaskSummary(taskSummary, 160) : "";
    
    return (
      <div className="flex items-center gap-3 min-w-0">
        <div className="shrink-0 overflow-hidden rounded-lg border-none bg-card shadow-none outline-none">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClick}
            className="flex items-center gap-2 border-none px-3 py-2 text-left shadow-none outline-none transition-colors duration-200"
          >
            <span className="font-sans text-[15px] font-bold leading-[140%] tracking-[-0.6px] text-[#3F3F46]">
              {subAgent.subAgentName}
            </span>
            {isExpanded ? (
              <ChevronUp size={14} className="shrink-0 text-[#70707B]" />
            ) : (
              <ChevronDown size={14} className="shrink-0 text-[#70707B]" />
            )}
          </Button>
        </div>
        {summary && (
          <span className="text-[13px] text-muted-foreground truncate min-w-0">
            {summary}
          </span>
        )}
      </div>
    );
  }
);

SubAgentIndicator.displayName = "SubAgentIndicator";
