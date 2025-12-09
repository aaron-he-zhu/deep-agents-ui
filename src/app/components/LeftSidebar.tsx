"use client";

import React, { useState, useMemo } from "react";
import {
  CheckCircle,
  Circle,
  Database,
  ListTodo,
  Loader2,
  Plus,
  Globe,
  Share2,
  BookOpen,
  ChevronRight,
  ChevronDown,
  FileText,
  Link as LinkIcon,
  Users,
  Megaphone,
  Briefcase,
  TrendingUp,
  File,
  Cpu,
  User,
  Layout,
  Palette,
  Network, // For On-site (Structure)
  ShoppingBag,
  MessageSquare,
  Newspaper,
  Target,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import type { TodoItem } from "@/app/types/types";
import { cn } from "@/lib/utils";
import { useContextMenu } from "@/providers/ContextProvider";
import { ContextWizard } from "@/app/components/ContextWizard";

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
          className={cn("flex-shrink-0 text-emerald-500", className)}
        />
      );
    case "in_progress":
      return (
        <Loader2
          size={14}
          className={cn("flex-shrink-0 text-amber-500 animate-spin", className)}
        />
      );
    default:
      return (
        <Circle
          size={14}
          className={cn("flex-shrink-0 text-muted-foreground/50", className)}
        />
      );
  }
};

// Tree Item Component
const TreeItem = ({ 
  label, 
  count, 
  icon: Icon, 
  children, 
  level = 0,
  defaultExpanded = false,
  onClick
}: { 
  label: string, 
  count?: number, 
  icon: any, 
  children?: React.ReactNode, 
  level?: number,
  defaultExpanded?: boolean,
  onClick?: () => void
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const hasChildren = !!children;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // Stop propagation to prevent opening context wizard when toggling
    if (hasChildren) {
      setExpanded(!expanded);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Stop propagation
    if (onClick) {
      onClick();
    } else if (hasChildren) {
      // If no specific click action, toggle expand
      setExpanded(!expanded);
    }
  };

  return (
    <div className="select-none">
      <div 
        className={cn(
          "flex items-center justify-between p-1.5 rounded-md hover:bg-accent/50 cursor-pointer transition-colors group text-sm",
          level > 0 && "ml-3"
        )}
        onClick={handleClick}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          {hasChildren ? (
            <div 
              role="button"
              className="text-muted-foreground/50 group-hover:text-muted-foreground p-0.5 hover:bg-accent rounded"
              onClick={handleToggle}
            >
              {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>
          ) : (
            <div className="w-[18px]" /> // Spacer
          )}
          
          <Icon size={14} className={cn(
            level === 0 ? "text-primary" : "text-muted-foreground"
          )} />
          <span className={cn(
            "truncate",
            level === 0 ? "font-medium" : "text-muted-foreground group-hover:text-foreground"
          )}>
            {label}
          </span>
        </div>
        
        {count !== undefined && (
          <span className="text-xs text-muted-foreground/60 tabular-nums px-1">
            {count}
          </span>
        )}
      </div>
      
      {hasChildren && expanded && (
        <div className="border-l border-border/50 ml-[11px]">
          {children}
        </div>
      )}
    </div>
  );
};

export const LeftSidebar = React.memo<LeftSidebarProps>(
  ({ todos, onAddContext }) => {
    const { contextData, isContextEmpty, wizardOpen, setWizardOpen } = useContextMenu();
    const [defaultWizardTab, setDefaultWizardTab] = useState<"onSite" | "offSite" | "knowledge">("onSite");

    const openWizard = (tab: "onSite" | "offSite" | "knowledge") => {
      setDefaultWizardTab(tab);
      setWizardOpen(true);
    };

    // Calculate Counts
    const onSiteCounts = {
      brandInfo: contextData.onSite.brandInfo?.name ? 1 : 0,
      products: contextData.onSite.productsServices?.length || 0,
      assets: contextData.onSite.brandAssets?.length || 0,
      content: (contextData.onSite.landingPages?.length || 0) + 
               (contextData.onSite.blogPosts?.length || 0) + 
               (contextData.onSite.websiteContent?.length || 0),
      team: contextData.onSite.team?.length || 0,
    };
    const onSiteTotal = Object.values(onSiteCounts).reduce((a, b) => a + b, 0);

    const offSiteCounts = {
      accounts: contextData.offSite.officialAccounts?.length || 0,
      pr: contextData.offSite.pressReleases?.length || 0,
      social: contextData.offSite.socialMediaContent?.length || 0,
      reviews: contextData.offSite.customerReviews?.length || 0,
      partners: contextData.offSite.partnerships?.length || 0,
    };
    const offSiteTotal = Object.values(offSiteCounts).reduce((a, b) => a + b, 0);

    const knowledgeCounts = {
      competitors: contextData.knowledge.competitors?.length || 0,
      personas: contextData.knowledge.audiencePersonas?.length || 0,
      market: contextData.knowledge.marketIntelligence?.length || 0,
      uploads: contextData.knowledge.userUploads?.length || 0,
      generated: contextData.knowledge.agentGenerated?.length || 0,
    };
    const knowledgeTotal = Object.values(knowledgeCounts).reduce((a, b) => a + b, 0);

    // Merge local todos
    const displayTodos = useMemo(() => {
      const localTodos: TodoItem[] = [];
      if (isContextEmpty) {
        localTodos.push({
          id: "local-fill-context",
          content: "Fill Context (Required for optimal results)",
          status: "pending",
          updatedAt: new Date(),
        });
      }
      return [...localTodos, ...todos];
    }, [todos, isContextEmpty]);

    return (
      <>
        <ContextWizard 
          open={wizardOpen} 
          onOpenChange={setWizardOpen} 
          defaultTab={defaultWizardTab} 
        />
        
        <div className="flex h-full flex-col p-2 pr-0">
          <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-background">
            <ResizablePanelGroup direction="vertical" autoSaveId="left-sidebar">
              {/* Context Module - Top Section */}
              <ResizablePanel
                id="context"
                order={1}
                defaultSize={60}
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
                    onClick={() => openWizard("onSite")}
                    className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-accent hover:text-foreground group-hover/context:opacity-100"
                    aria-label="Add context"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                
                <div className="flex-1 min-h-0 overflow-y-auto p-2">
                  <div className="space-y-1">
                    {/* On-site Tree */}
                    <TreeItem 
                      label="On-site" 
                      count={onSiteTotal} 
                      icon={Network} // Organization Structure Icon
                      defaultExpanded={true}
                      onClick={() => openWizard("onSite")}
                    >
                      <TreeItem label="Brand Identity" count={onSiteCounts.brandInfo} icon={Briefcase} level={1} />
                      <TreeItem label="Products & Services" count={onSiteCounts.products} icon={ShoppingBag} level={1} />
                      <TreeItem label="Brand Assets" count={onSiteCounts.assets} icon={Palette} level={1} />
                      <TreeItem label="Website Content" count={onSiteCounts.content} icon={Layout} level={1} />
                      <TreeItem label="Team & Culture" count={onSiteCounts.team} icon={Users} level={1} />
                    </TreeItem>

                    {/* Off-site Tree */}
                    <TreeItem 
                      label="Off-site" 
                      count={offSiteTotal} 
                      icon={Globe} // Earth Icon
                      onClick={() => openWizard("offSite")}
                    >
                      <TreeItem label="Official Channels" count={offSiteCounts.accounts} icon={Megaphone} level={1} />
                      <TreeItem label="PR & Media" count={offSiteCounts.pr} icon={Newspaper} level={1} />
                      <TreeItem label="Social & Influencers" count={offSiteCounts.social} icon={Share2} level={1} />
                      <TreeItem label="Customer Reviews" count={offSiteCounts.reviews} icon={MessageSquare} level={1} />
                      <TreeItem label="Partnerships" count={offSiteCounts.partners} icon={Briefcase} level={1} />
                    </TreeItem>

                    {/* Knowledge Tree */}
                    <TreeItem 
                      label="Knowledge" 
                      count={knowledgeTotal} 
                      icon={BookOpen}
                      onClick={() => openWizard("knowledge")}
                    >
                      <TreeItem label="Competitor Intel" count={knowledgeCounts.competitors} icon={TrendingUp} level={1} />
                      <TreeItem label="Audience Personas" count={knowledgeCounts.personas} icon={Target} level={1} />
                      <TreeItem label="Market Research" count={knowledgeCounts.market} icon={Globe} level={1} />
                      <TreeItem label="Internal Docs" count={knowledgeCounts.uploads} icon={FileText} level={1} />
                      <TreeItem label="Generated Insights" count={knowledgeCounts.generated} icon={Cpu} level={1} />
                    </TreeItem>
                  </div>
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Tasks Module - Bottom Section */}
              <ResizablePanel
                id="tasks"
                order={2}
                defaultSize={40}
                minSize={30}
                className="flex flex-col overflow-hidden"
              >
                <div className="flex-shrink-0 flex h-12 items-center gap-2 px-4 border-b border-border bg-muted/30">
                  <ListTodo size={16} className="text-muted-foreground" />
                  <span className="text-sm font-semibold tracking-wide">
                    Tasks
                  </span>
                  {displayTodos.length > 0 && (
                    <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {displayTodos.filter((t) => t.status !== "completed").length} active
                    </span>
                  )}
                </div>

                <div className="flex-1 min-h-0 overflow-hidden">
                  {displayTodos.length === 0 ? (
                    <div className="flex h-full items-center justify-center px-4 pb-4">
                      <p className="text-xs text-muted-foreground">
                        No tasks created yet
                      </p>
                    </div>
                  ) : (
                    <ScrollArea className="h-full px-4 py-2">
                      <div className="space-y-1.5">
                        {displayTodos.map((todo, index) => (
                          <div
                            key={`${todo.id}_${index}`}
                            className={cn(
                              "flex items-start gap-2 rounded-md p-2 text-sm transition-colors cursor-default",
                              todo.status === "completed" && "opacity-50",
                              todo.id === "local-fill-context" && "bg-amber-500/10 hover:bg-amber-500/20 cursor-pointer"
                            )}
                            onClick={() => {
                              if (todo.id === "local-fill-context") {
                                openWizard("onSite");
                              }
                            }}
                          >
                            {getStatusIcon(todo.status, "mt-0.5")}
                            <span
                              className={cn(
                                "flex-1 break-words leading-relaxed",
                                todo.status === "completed" && "line-through text-muted-foreground"
                              )}
                            >
                              {todo.content}
                            </span>
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
      </>
    );
  }
);

LeftSidebar.displayName = "LeftSidebar";
