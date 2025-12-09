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
  Paintbrush,
  Book,
  Box,
  Flag,
  AlertCircle,
  Zap,
  Building,
  Star,
  Info,
  HelpCircle,
  MapPin,
  Mail,
  Phone,
  LayoutList,
  Type,
  Handshake,
  BarChart3,
  Folder,
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
      // Brand Breakdown
      brandMeta: (contextData.onSite.brandInfo?.name ? 1 : 0) + (contextData.onSite.websiteContent?.filter((c: any) => c.url === "#meta-subtitle").length || 0),
      brandLogo: (contextData.onSite.websiteContent?.filter((c: any) => c.url?.startsWith("#brand-logo")).length || 0),
      brandColors: (contextData.onSite.websiteContent?.filter((c: any) => c.url?.startsWith("#brand-color")).length || 0),
      brandFonts: (contextData.onSite.websiteContent?.filter((c: any) => c.url?.startsWith("#brand-font")).length || 0),
      brandTone: (contextData.onSite.websiteContent?.filter((c: any) => c.url === "#brand-tone").length || 0),
      brandLangs: (contextData.onSite.websiteContent?.filter((c: any) => c.url === "#brand-languages").length || 0),
      get brand() { return this.brandMeta + this.brandLogo + this.brandColors + this.brandFonts + this.brandTone + this.brandLangs; },

      // Pages Breakdown
      pagesCore: contextData.onSite.websiteContent?.filter((c: any) => ["home", "about", "career", "legal"].includes(c.type) || c.url === "#page-contact").length || 0,
      pagesProduct: contextData.onSite.websiteContent?.filter((c: any) => c.type === "pricing" || ["#page-products", "#page-features", "#page-solutions"].includes(c.url)).length || 0,
      pagesResources: contextData.onSite.websiteContent?.filter((c: any) => ["documentation", "faq", "case_study"].includes(c.type) || c.url === "#page-blog").length || 0,
      pagesLegal: contextData.onSite.websiteContent?.filter((c: any) => c.type === "legal" || ["#page-privacy", "#page-changelog", "#page-status"].includes(c.url)).length || 0,
      get pages() { return this.pagesCore + this.pagesProduct + this.pagesResources + this.pagesLegal; },

      landing: contextData.onSite.landingPages?.length || 0,
      blog: contextData.onSite.blogPosts?.length || 0,

      // Hero Breakdown
      heroHeadline: (contextData.onSite.brandInfo?.uniqueSellingPoints?.[0] ? 1 : 0),
      heroSubheadline: (contextData.onSite.brandInfo?.tagline ? 1 : 0),
      heroCTA: (contextData.onSite.websiteContent?.filter((c: any) => c.url === "#cta").length || 0),
      heroMedia: (contextData.onSite.websiteContent?.filter((c: any) => c.url === "#hero-media").length || 0),
      heroMetrics: (contextData.onSite.websiteContent?.filter((c: any) => c.url === "#metric").length || 0),
      get hero() { return this.heroHeadline + this.heroSubheadline + this.heroCTA + this.heroMedia + this.heroMetrics; },

      problem: (contextData.onSite.websiteContent?.filter((c: any) => c.url === "#problem").length || 0),
      audience: (contextData.onSite.websiteContent?.filter((c: any) => c.url === "#audience").length || 0),
      useCases: (contextData.onSite.websiteContent?.filter((c: any) => c.url === "#use-case").length || 0),
      industries: (contextData.onSite.websiteContent?.filter((c: any) => c.url === "#industry").length || 0),
      products: contextData.onSite.productsServices?.length || 0,

      // Social Proof Breakdown
      spTestimonials: contextData.onSite.websiteContent?.filter((c: any) => c.type === "testimonial").length || 0,
      spCases: contextData.onSite.websiteContent?.filter((c: any) => c.type === "case_study").length || 0,
      spBadges: contextData.onSite.websiteContent?.filter((c: any) => c.url === "#logo").length || 0,
      spAwards: contextData.onSite.websiteContent?.filter((c: any) => c.url === "#award").length || 0,
      spGuarantees: contextData.onSite.websiteContent?.filter((c: any) => c.url === "#guarantee").length || 0,
      spIntegrations: contextData.onSite.websiteContent?.filter((c: any) => c.url === "#integration").length || 0,
      get socialProof() { return this.spTestimonials + this.spCases + this.spBadges + this.spAwards + this.spGuarantees + this.spIntegrations; },

      team: contextData.onSite.team?.length || 0,

      // About Breakdown
      aboutStory: (contextData.onSite.brandInfo?.foundingStory ? 1 : 0),
      aboutMission: (contextData.onSite.brandInfo?.mission ? 1 : 0) + (contextData.onSite.brandInfo?.vision ? 1 : 0),
      aboutValues: (contextData.onSite.brandInfo?.coreValues?.length || 0),
      get about() { return this.aboutStory + this.aboutMission + this.aboutValues; },

      faq: contextData.onSite.websiteContent?.filter((c: any) => c.type === "faq").length || 0,

      // Contact Breakdown
      contactPrimary: contextData.onSite.websiteContent?.filter((c: any) => ["#contact-email", "#contact-sales", "#contact-phone"].includes(c.url)).length || 0,
      contactLocation: contextData.onSite.websiteContent?.filter((c: any) => ["#contact-address", "#contact-hours", "#contact-timezone"].includes(c.url)).length || 0,
      contactSupport: contextData.onSite.websiteContent?.filter((c: any) => ["#contact-support", "#support-chat", "#support-ticket", "#support-community"].includes(c.url)).length || 0,
      contactAdditional: contextData.onSite.websiteContent?.filter((c: any) => ["#contact-press", "#contact-partners", "#contact-careers", "#contact-newsletter"].includes(c.url)).length || 0,
      get contact() { return this.contactPrimary + this.contactLocation + this.contactSupport + this.contactAdditional; },
    };
    const onSiteTotal = Object.values(onSiteCounts).filter(v => typeof v === 'number').reduce((a: number, b: any) => a + b, 0);
    // Recalculate Total for OnSite
    const onSiteRealTotal = onSiteCounts.brand + onSiteCounts.pages + onSiteCounts.landing + onSiteCounts.blog + onSiteCounts.hero + onSiteCounts.problem + onSiteCounts.audience + onSiteCounts.useCases + onSiteCounts.industries + onSiteCounts.products + onSiteCounts.socialProof + onSiteCounts.team + onSiteCounts.about + onSiteCounts.faq + onSiteCounts.contact;

    const offSiteCounts = {
      // Digital Presence
      osChannels: contextData.offSite.officialAccounts?.length || 0,
      osSocial: contextData.offSite.socialMediaContent?.length || 0,
      get presence() { return this.osChannels + this.osSocial; },

      // PR
      osPROnly: (contextData.offSite.pressReleases?.filter((p: any) => p.type === "press_release").length || 0),
      osMedia: (contextData.offSite.pressReleases?.filter((p: any) => p.type !== "press_release").length || 0),
      get pr() { return this.osPROnly + this.osMedia; },

      // Reputation
      osReviews: contextData.offSite.customerReviews?.length || 0,
      get reputation() { return this.osReviews; },

      // Ecosystem
      osPartners: contextData.offSite.partnerships?.length || 0,
      get ecosystem() { return this.osPartners; },
    };
    // Correct total calculation
    const offSiteTotal = offSiteCounts.presence + offSiteCounts.pr + offSiteCounts.reputation + offSiteCounts.ecosystem;

    const knowledgeCounts = {
      // Market Intel
      kReports: (contextData.knowledge.marketIntelligence?.filter((m: any) => m.type !== "news").length || 0),
      kNews: (contextData.knowledge.marketIntelligence?.filter((m: any) => m.type === "news").length || 0),
      kPersonas: contextData.knowledge.audiencePersonas?.length || 0,
      get market() { return this.kReports + this.kNews + this.kPersonas; },

      // Competitive
      kCompetitors: contextData.knowledge.competitors?.length || 0,
      get competitive() { return this.kCompetitors; },

      // Internal
      kUploads: contextData.knowledge.userUploads?.length || 0,
      get internal() { return this.kUploads; },

      // Memory
      kGenerated: contextData.knowledge.agentGenerated?.length || 0,
      get memory() { return this.kGenerated; },
    };
    const knowledgeTotal = knowledgeCounts.market + knowledgeCounts.competitive + knowledgeCounts.internal + knowledgeCounts.memory;

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
                      count={onSiteRealTotal}
                      icon={Network}
                      defaultExpanded={true}
                      onClick={() => openWizard("onSite")}
                    >
                      {/* Brand & Pages Column */}
                      <TreeItem label="Brand Assets" count={onSiteCounts.brand} icon={Paintbrush} level={1} onClick={() => openWizard("onSite")}>
                        <TreeItem label="Meta Info" count={onSiteCounts.brandMeta} icon={FileText} level={2} />
                        <TreeItem label="Logo URL" count={onSiteCounts.brandLogo} icon={LinkIcon} level={2} />
                        <TreeItem label="Colors" count={onSiteCounts.brandColors} icon={Palette} level={2} />
                        <TreeItem label="Typography" count={onSiteCounts.brandFonts} icon={FileText} level={2} />
                        <TreeItem label="Tone" count={onSiteCounts.brandTone} icon={MessageSquare} level={2} />
                        <TreeItem label="Languages" count={onSiteCounts.brandLangs} icon={Globe} level={2} />
                      </TreeItem>

                      <TreeItem label="Key Website Pages" count={onSiteCounts.pages} icon={Layout} level={1} onClick={() => openWizard("onSite")}>
                        <TreeItem label="Core Pages" count={onSiteCounts.pagesCore} icon={File} level={2} />
                        <TreeItem label="Product Pages" count={onSiteCounts.pagesProduct} icon={ShoppingBag} level={2} />
                        <TreeItem label="Resources" count={onSiteCounts.pagesResources} icon={Book} level={2} />
                        <TreeItem label="Legal & Updates" count={onSiteCounts.pagesLegal} icon={FileText} level={2} />
                      </TreeItem>

                      <TreeItem label="Landing Pages" count={onSiteCounts.landing} icon={Megaphone} level={1} onClick={() => openWizard("onSite")} />
                      <TreeItem label="Blog & Resources" count={onSiteCounts.blog} icon={Book} level={1} onClick={() => openWizard("onSite")} />

                      {/* Content Column */}
                      <TreeItem label="Hero Section" count={onSiteCounts.hero} icon={Flag} level={1} onClick={() => openWizard("onSite")}>
                        <TreeItem label="Headline" count={onSiteCounts.heroHeadline} icon={Type} level={2} />
                        <TreeItem label="Subheadline" count={onSiteCounts.heroSubheadline} icon={FileText} level={2} />
                        <TreeItem label="Call to Action" count={onSiteCounts.heroCTA} icon={Layout} level={2} />
                        <TreeItem label="Media" count={onSiteCounts.heroMedia} icon={FileText} level={2} />
                        <TreeItem label="Metrics" count={onSiteCounts.heroMetrics} icon={TrendingUp} level={2} />
                      </TreeItem>

                      <TreeItem label="Problem Statement" count={onSiteCounts.problem} icon={AlertCircle} level={1} onClick={() => openWizard("onSite")} />
                      <TreeItem label="Who We Serve" count={onSiteCounts.audience} icon={Users} level={1} onClick={() => openWizard("onSite")} />
                      <TreeItem label="Use Cases" count={onSiteCounts.useCases} icon={Zap} level={1} onClick={() => openWizard("onSite")} />
                      <TreeItem label="Industries" count={onSiteCounts.industries} icon={Building} level={1} onClick={() => openWizard("onSite")} />
                      <TreeItem label="Products & Services" count={onSiteCounts.products} icon={ShoppingBag} level={1} onClick={() => openWizard("onSite")} />

                      <TreeItem label="Social Proof & Trust" count={onSiteCounts.socialProof} icon={Star} level={1} onClick={() => openWizard("onSite")}>
                        <TreeItem label="Testimonials" count={onSiteCounts.spTestimonials} icon={MessageSquare} level={2} />
                        <TreeItem label="Case Studies" count={onSiteCounts.spCases} icon={FileText} level={2} />
                        <TreeItem label="Badges" count={onSiteCounts.spBadges} icon={CheckCircle} level={2} />
                        <TreeItem label="Awards" count={onSiteCounts.spAwards} icon={Star} level={2} />
                        <TreeItem label="Guarantees" count={onSiteCounts.spGuarantees} icon={CheckCircle} level={2} />
                        <TreeItem label="Integrations" count={onSiteCounts.spIntegrations} icon={LinkIcon} level={2} />
                      </TreeItem>

                      <TreeItem label="Leadership Team" count={onSiteCounts.team} icon={Users} level={1} onClick={() => openWizard("onSite")} />

                      <TreeItem label="About Us" count={onSiteCounts.about} icon={Info} level={1} onClick={() => openWizard("onSite")}>
                        <TreeItem label="Company Story" count={onSiteCounts.aboutStory} icon={Book} level={2} />
                        <TreeItem label="Mission & Vision" count={onSiteCounts.aboutMission} icon={Target} level={2} />
                        <TreeItem label="Core Values" count={onSiteCounts.aboutValues} icon={Star} level={2} />
                      </TreeItem>

                      <TreeItem label="FAQ" count={onSiteCounts.faq} icon={HelpCircle} level={1} onClick={() => openWizard("onSite")} />

                      <TreeItem label="Contact Information" count={onSiteCounts.contact} icon={Mail} level={1} onClick={() => openWizard("onSite")}>
                        <TreeItem label="Primary Contact" count={onSiteCounts.contactPrimary} icon={Phone} level={2} />
                        <TreeItem label="Location & Hours" count={onSiteCounts.contactLocation} icon={MapPin} level={2} />
                        <TreeItem label="Support Channels" count={onSiteCounts.contactSupport} icon={HelpCircle} level={2} />
                        <TreeItem label="Additional" count={onSiteCounts.contactAdditional} icon={LayoutList} level={2} />
                      </TreeItem>

                    </TreeItem>

                    {/* Off-site Tree */}
                    <TreeItem
                      label="Off-site"
                      count={offSiteTotal}
                      icon={Globe}
                      onClick={() => openWizard("offSite")}
                    >
                      <TreeItem label="Digital Presence" count={offSiteCounts.presence} icon={Share2} level={1} onClick={() => openWizard("offSite")}>
                        <TreeItem label="Official Accounts" count={offSiteCounts.osChannels} icon={Globe} level={2} />
                        <TreeItem label="Social Listening" count={offSiteCounts.osSocial} icon={MessageSquare} level={2} />
                      </TreeItem>

                      <TreeItem label="Public Relations" count={offSiteCounts.pr} icon={Newspaper} level={1} onClick={() => openWizard("offSite")}>
                        <TreeItem label="Press Releases" count={offSiteCounts.osPROnly} icon={FileText} level={2} />
                        <TreeItem label="Media Coverage" count={offSiteCounts.osMedia} icon={Megaphone} level={2} />
                      </TreeItem>

                      <TreeItem label="Reputation" count={offSiteCounts.reputation} icon={Star} level={1} onClick={() => openWizard("offSite")}>
                        <TreeItem label="Customer Reviews" count={offSiteCounts.osReviews} icon={MessageSquare} level={2} />
                      </TreeItem>

                      <TreeItem label="Strategic Ecosystem" count={offSiteCounts.ecosystem} icon={Handshake} level={1} onClick={() => openWizard("offSite")}>
                        <TreeItem label="Partnerships" count={offSiteCounts.osPartners} icon={Briefcase} level={2} />
                      </TreeItem>
                    </TreeItem>

                    {/* Knowledge Tree */}
                    <TreeItem
                      label="Knowledge"
                      count={knowledgeTotal}
                      icon={BookOpen}
                      onClick={() => openWizard("knowledge")}
                    >
                      <TreeItem label="Market Intelligence" count={knowledgeCounts.market} icon={BarChart3} level={1} onClick={() => openWizard("knowledge")}>
                        <TreeItem label="Research & Trends" count={knowledgeCounts.kReports} icon={TrendingUp} level={2} />
                        <TreeItem label="Target Audience" count={knowledgeCounts.kPersonas} icon={Users} level={2} />
                      </TreeItem>

                      <TreeItem label="Competitive Landscape" count={knowledgeCounts.competitive} icon={TrendingUp} level={1} onClick={() => openWizard("knowledge")}>
                        <TreeItem label="Competitors" count={knowledgeCounts.kCompetitors} icon={Target} level={2} />
                      </TreeItem>

                      <TreeItem label="Product & Internal" count={knowledgeCounts.internal} icon={Folder} level={1} onClick={() => openWizard("knowledge")}>
                        <TreeItem label="Files & Uploads" count={knowledgeCounts.kUploads} icon={File} level={2} />
                      </TreeItem>

                      <TreeItem label="Agent Memory" count={knowledgeCounts.memory} icon={Database} level={1} onClick={() => openWizard("knowledge")}>
                        <TreeItem label="Generated Insights" count={knowledgeCounts.kGenerated} icon={Cpu} level={2} />
                      </TreeItem>
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
        </div >
      </>
    );
  }
);

LeftSidebar.displayName = "LeftSidebar";
