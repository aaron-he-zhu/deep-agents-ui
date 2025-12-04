"use client";

import React from "react";
import {
  CheckCircle,
  Circle,
  Clock,
  Database,
  ListTodo,
  Plus,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import type { TodoItem } from "@/app/types/types";
import { cn } from "@/lib/utils";

interface LeftSidebarProps {
  todos: TodoItem[];
  onAddContext?: () => void;
}

const getStatusIcon = (status: TodoItem["status"], className?: string) => {
  switch (status) {
    case "completed":
      return (
        <CheckCircle
          size={14}
          className={cn("flex-shrink-0 text-success/80", className)}
        />
      );
    case "in_progress":
      return (
        <Clock
          size={14}
          className={cn("flex-shrink-0 text-warning/80", className)}
        />
      );
    default:
      return (
        <Circle
          size={14}
          className={cn("flex-shrink-0 text-tertiary/70", className)}
        />
      );
  }
};

const groupedLabels = {
  in_progress: "In Progress",
  pending: "Pending",
  completed: "Completed",
};

export const LeftSidebar = React.memo<LeftSidebarProps>(
  ({ todos, onAddContext }) => {
    const groupedTodos = {
      in_progress: todos.filter((t) => t.status === "in_progress"),
      pending: todos.filter((t) => t.status === "pending"),
      completed: todos.filter((t) => t.status === "completed"),
    };

    // Get the current active task (first in_progress task)
    const activeTask = groupedTodos.in_progress[0];

    return (
      <div className="flex h-full flex-col p-2 pr-0">
        <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-background">
          <ResizablePanelGroup direction="vertical" autoSaveId="left-sidebar">
            {/* Context Module - Top Section */}
            <ResizablePanel
              id="context"
              order={1}
              defaultSize={50}
              minSize={30}
              className="group/context flex flex-col overflow-hidden"
            >
              <div className="flex-shrink-0 flex h-12 items-center justify-between px-4 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2">
                  <Database size={16} className="text-muted-foreground" />
                  <span className="text-sm font-semibold tracking-wide">
                    Context
                  </span>
                </div>
                <button
                  onClick={onAddContext}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-accent hover:text-foreground group-hover/context:opacity-100"
                  aria-label="Add context"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden flex items-center justify-center px-4 pb-4">
                <p className="text-xs text-muted-foreground">
                  No context added yet
                </p>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Tasks Module - Bottom Section */}
            <ResizablePanel
              id="tasks"
              order={2}
              defaultSize={50}
              minSize={30}
              className="flex flex-col overflow-hidden"
            >
              <div className="flex-shrink-0 flex h-12 items-center gap-2 px-4 border-b border-border bg-muted/30">
                <ListTodo size={16} className="text-muted-foreground" />
                <span className="text-sm font-semibold tracking-wide">
                  Tasks
                </span>
                {todos.length > 0 && (
                  <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {todos.filter((t) => t.status !== "completed").length} active
                  </span>
                )}
              </div>

              {/* Active task summary - second row */}
              {activeTask && (
                <div className="flex-shrink-0 mx-4 mb-2 flex items-start gap-2 rounded-md bg-warning/10 p-2 text-sm">
                  <Clock
                    size={14}
                    className="mt-0.5 flex-shrink-0 text-warning"
                  />
                  <span className="flex-1 truncate text-warning-foreground">
                    {activeTask.content}
                  </span>
                </div>
              )}

              <div className="flex-1 min-h-0 overflow-hidden">
                {todos.length === 0 ? (
                  <div className="flex h-full items-center justify-center px-4 pb-4">
                    <p className="text-xs text-muted-foreground">
                      No tasks created yet
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-full px-4 pb-4">
                    <div className="space-y-4">
                      {(
                        Object.entries(groupedTodos) as [
                          keyof typeof groupedTodos,
                          TodoItem[],
                        ][]
                      )
                        .filter(([, items]) => items.length > 0)
                        .map(([status, items]) => (
                          <div key={status}>
                            <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                              {groupedLabels[status]}
                            </h3>
                            <div className="space-y-1.5">
                              {items.map((todo, index) => (
                                <div
                                  key={`${status}_${todo.id}_${index}`}
                                  className={cn(
                                    "flex items-start gap-2 rounded-md p-2 text-sm",
                                    status === "in_progress" && "bg-warning/5",
                                    status === "completed" && "opacity-60"
                                  )}
                                >
                                  {getStatusIcon(todo.status, "mt-0.5")}
                                  <span
                                    className={cn(
                                      "flex-1 break-words leading-relaxed",
                                      status === "completed" && "line-through"
                                    )}
                                  >
                                    {todo.content}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    );
  }
);

LeftSidebar.displayName = "LeftSidebar";
