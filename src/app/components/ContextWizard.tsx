"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useContextMenu } from "@/providers/ContextProvider";
import { Plus, X, Link, Briefcase, ShoppingBag, Layout, Users, Megaphone, Share2, MessageSquare, TrendingUp, Target, Globe, FileText } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import { 
  LandingPage, 
  ProductService,
  TeamMember,
  WebsiteContent,
  OfficialAccount, 
  Partnership,
  CustomerReview,
  Competitor,
  AudiencePersona,
  MarketIntelligence,
  BlogPost,
  PressRelease,
  SocialMediaContent,
  UserUpload,
} from "@/app/types/context";

interface ContextWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "onSite" | "offSite" | "knowledge";
}

export function ContextWizard({ open, onOpenChange, defaultTab = "onSite" }: ContextWizardProps) {
  const { contextData, updateOnSite, updateOffSite, updateKnowledge } = useContextMenu();
  const [activeTab, setActiveTab] = useState(defaultTab);

  // --- Helper Components ---

  const SimpleArrayInput = ({ 
    label,
    values, 
    onChange, 
    placeholder,
    icon: Icon = Link
  }: { 
    label: string,
    values: string[], 
    onChange: (values: string[]) => void,
    placeholder?: string,
    icon?: any
  }) => {
    const add = () => onChange([...values, ""]);
    const remove = (idx: number) => onChange(values.filter((_, i) => i !== idx));
    const update = (idx: number, val: string) => {
      const newValues = [...values];
      newValues[idx] = val;
      onChange(newValues);
    };

    return (
      <div className="space-y-2 pt-2">
        <Label className="text-sm font-semibold">{label}</Label>
        {values.map((val, idx) => (
          <div key={idx} className="flex gap-2">
            <div className="relative flex-1">
              <Icon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                className="pl-9"
                value={val} 
                onChange={(e) => update(idx, e.target.value)} 
                placeholder={placeholder}
              />
            </div>
            <Button variant="ghost" size="icon" onClick={() => remove(idx)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={add} className="w-full border-dashed">
          <Plus className="h-4 w-4 mr-2" /> Add Item
        </Button>
      </div>
    );
  };

  const ComplexListInput = <T extends { id: string, [key: string]: any }>({
    label,
    items,
    renderItem,
    onAdd,
    onRemove,
    onChange
  }: {
    label: string;
    items: T[];
    renderItem: (item: T, onChange: (updated: T) => void) => React.ReactNode;
    onAdd: () => void;
    onRemove: (id: string) => void;
    onChange: (updatedItems: T[]) => void;
  }) => {
    return (
      <div className="space-y-3 pt-4 border-t first:border-t-0 first:pt-0">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold flex items-center gap-2">
            {label}
          </Label>
          <span className="text-xs text-muted-foreground">{items.length} items</span>
        </div>
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={item.id} className="relative group rounded-lg border bg-card p-3 shadow-sm">
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-2 top-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onRemove(item.id)}
              >
                <X className="h-3 w-3" />
              </Button>
              {renderItem(item, (updated) => {
                const newItems = [...items];
                newItems[idx] = updated;
                onChange(newItems);
              })}
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={onAdd} className="w-full border-dashed">
            <Plus className="h-4 w-4 mr-2" /> Add {label}
          </Button>
        </div>
      </div>
    );
  };

  // --- Render Functions for Complex Types ---

  const renderProductService = (item: ProductService, onChange: (i: ProductService) => void) => (
    <div className="grid gap-3">
      <Input 
        placeholder="Product/Service Name" 
        value={item.name} 
        onChange={(e) => onChange({ ...item, name: e.target.value })}
        className="font-medium"
      />
      <div className="flex gap-2">
        <select 
          className="h-9 w-32 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm"
          value={item.type}
          onChange={(e) => onChange({ ...item, type: e.target.value as any })}
        >
          <option value="product">Product</option>
          <option value="service">Service</option>
          <option value="subscription">Subscription</option>
        </select>
        <Input 
          placeholder="Price (e.g. $99/mo)" 
          value={item.price || ""} 
          onChange={(e) => onChange({ ...item, price: e.target.value })}
          className="flex-1 text-xs"
        />
      </div>
      <Textarea 
        placeholder="Key features and description..." 
        value={item.description || ""}
        onChange={(e) => onChange({ ...item, description: e.target.value })}
        className="text-xs min-h-[60px]"
      />
    </div>
  );

  const renderLandingPage = (item: LandingPage, onChange: (i: LandingPage) => void) => (
    <div className="grid gap-3">
      <Input 
        placeholder="Page Name (e.g. Summer Campaign)" 
        value={item.name} 
        onChange={(e) => onChange({ ...item, name: e.target.value })}
        className="font-medium"
      />
      <div className="flex gap-2">
        <Input 
          placeholder="https://..." 
          value={item.url} 
          onChange={(e) => onChange({ ...item, url: e.target.value })}
          className="flex-1 text-xs"
        />
        <select 
          className="h-9 w-24 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm"
          value={item.type}
          onChange={(e) => onChange({ ...item, type: e.target.value as any })}
        >
          <option value="product">Product</option>
          <option value="campaign">Campaign</option>
          <option value="event">Event</option>
          <option value="other">Other</option>
        </select>
      </div>
    </div>
  );

  const renderWebsiteContent = (item: WebsiteContent, onChange: (i: WebsiteContent) => void) => (
    <div className="grid gap-3">
      <div className="flex gap-2">
        <select 
          className="h-9 w-32 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm"
          value={item.type}
          onChange={(e) => onChange({ ...item, type: e.target.value as any })}
        >
          <option value="home">Home</option>
          <option value="about">About</option>
          <option value="pricing">Pricing</option>
          <option value="faq">FAQ</option>
          <option value="other">Other</option>
        </select>
        <Input 
          placeholder="Page Name" 
          value={item.name} 
          onChange={(e) => onChange({ ...item, name: e.target.value })}
          className="flex-1"
        />
      </div>
      <Input 
        placeholder="https://..." 
        value={item.url} 
        onChange={(e) => onChange({ ...item, url: e.target.value })}
        className="text-xs"
      />
    </div>
  );

  const renderTeamMember = (item: TeamMember, onChange: (i: TeamMember) => void) => (
    <div className="grid gap-3">
      <div className="flex gap-2">
        <Input 
          placeholder="Name" 
          value={item.name} 
          onChange={(e) => onChange({ ...item, name: e.target.value })}
          className="font-medium flex-1"
        />
        <Input 
          placeholder="Role" 
          value={item.role} 
          onChange={(e) => onChange({ ...item, role: e.target.value })}
          className="flex-1"
        />
      </div>
      <Input 
        placeholder="LinkedIn URL" 
        value={item.linkedin || ""} 
        onChange={(e) => onChange({ ...item, linkedin: e.target.value })}
        className="text-xs"
      />
    </div>
  );

  const renderOfficialAccount = (item: OfficialAccount, onChange: (i: OfficialAccount) => void) => (
    <div className="grid gap-3">
      <div className="flex gap-2">
        <select 
          className="h-9 w-32 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm"
          value={item.platform}
          onChange={(e) => onChange({ ...item, platform: e.target.value as any })}
        >
          <option value="twitter">Twitter</option>
          <option value="linkedin">LinkedIn</option>
          <option value="facebook">Facebook</option>
          <option value="instagram">Instagram</option>
          <option value="youtube">YouTube</option>
          <option value="tiktok">TikTok</option>
          <option value="wechat">WeChat</option>
          <option value="other">Other</option>
        </select>
        <Input 
          placeholder="Account Name / Handle" 
          value={item.accountName} 
          onChange={(e) => onChange({ ...item, accountName: e.target.value })}
          className="flex-1"
        />
      </div>
      <Input 
        placeholder="Profile URL" 
        value={item.url} 
        onChange={(e) => onChange({ ...item, url: e.target.value })}
        className="text-xs"
      />
    </div>
  );

  const renderPartnership = (item: Partnership, onChange: (i: Partnership) => void) => (
    <div className="grid gap-3">
      <Input 
        placeholder="Partner Name" 
        value={item.name} 
        onChange={(e) => onChange({ ...item, name: e.target.value })}
        className="font-medium"
      />
      <div className="flex gap-2">
        <select 
          className="h-9 w-32 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm"
          value={item.type}
          onChange={(e) => onChange({ ...item, type: e.target.value as any })}
        >
          <option value="distributor">Distributor</option>
          <option value="technology">Tech Partner</option>
          <option value="media_partner">Media</option>
          <option value="affiliate">Affiliate</option>
          <option value="other">Other</option>
        </select>
        <select 
          className="h-9 w-24 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm"
          value={item.status}
          onChange={(e) => onChange({ ...item, status: e.target.value as any })}
        >
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
    </div>
  );

  const renderCustomerReview = (item: CustomerReview, onChange: (i: CustomerReview) => void) => (
    <div className="grid gap-3">
      <div className="flex gap-2">
        <Input 
          placeholder="Review Source (e.g. G2)" 
          value={item.source} 
          onChange={(e) => onChange({ ...item, source: e.target.value })}
          className="flex-1"
        />
        <Input 
          placeholder="Rating (1-5)" 
          type="number"
          value={item.rating || ""} 
          onChange={(e) => onChange({ ...item, rating: parseFloat(e.target.value) })}
          className="w-24"
        />
      </div>
      <Textarea 
        placeholder="Review content..." 
        value={item.content}
        onChange={(e) => onChange({ ...item, content: e.target.value })}
        className="text-xs min-h-[60px]"
      />
    </div>
  );

  const renderCompetitor = (item: Competitor, onChange: (i: Competitor) => void) => (
    <div className="grid gap-3">
      <Input 
        placeholder="Competitor Name" 
        value={item.name} 
        onChange={(e) => onChange({ ...item, name: e.target.value })}
        className="font-medium"
      />
      <div className="flex gap-2">
        <Input 
          placeholder="Website URL" 
          value={item.website} 
          onChange={(e) => onChange({ ...item, website: e.target.value })}
          className="flex-1 text-xs"
        />
        <select 
          className="h-9 w-24 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm"
          value={item.category}
          onChange={(e) => onChange({ ...item, category: e.target.value as any })}
        >
          <option value="direct">Direct</option>
          <option value="indirect">Indirect</option>
          <option value="potential">Potential</option>
        </select>
      </div>
      <Textarea 
        placeholder="Strengths, weaknesses, or notes..." 
        value={item.description || ""}
        onChange={(e) => onChange({ ...item, description: e.target.value })}
        className="text-xs min-h-[60px]"
      />
    </div>
  );

  const renderPersona = (item: AudiencePersona, onChange: (i: AudiencePersona) => void) => (
    <div className="grid gap-3">
      <Input 
        placeholder="Persona Name (e.g. Tech-Savvy Tina)" 
        value={item.name} 
        onChange={(e) => onChange({ ...item, name: e.target.value })}
        className="font-medium"
      />
      <Textarea 
        placeholder="Description and key traits..." 
        value={item.description}
        onChange={(e) => onChange({ ...item, description: e.target.value })}
        className="text-xs min-h-[60px]"
      />
      <Input 
        placeholder="Key demographics..." 
        value={item.demographics || ""}
        onChange={(e) => onChange({ ...item, demographics: e.target.value })}
        className="text-xs"
      />
    </div>
  );

  const renderMarketIntel = (item: MarketIntelligence, onChange: (i: MarketIntelligence) => void) => (
    <div className="grid gap-3">
      <Input 
        placeholder="Report Title / Trend" 
        value={item.title} 
        onChange={(e) => onChange({ ...item, title: e.target.value })}
        className="font-medium"
      />
      <div className="flex gap-2">
        <select 
          className="h-9 w-32 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm"
          value={item.type}
          onChange={(e) => onChange({ ...item, type: e.target.value as any })}
        >
          <option value="industry_report">Report</option>
          <option value="market_trend">Trend</option>
          <option value="news">News</option>
          <option value="statistics">Stats</option>
        </select>
        <Input 
          placeholder="Source" 
          value={item.source} 
          onChange={(e) => onChange({ ...item, source: e.target.value })}
          className="flex-1 text-xs"
        />
      </div>
      <Input 
        placeholder="URL" 
        value={item.url || ""}
        onChange={(e) => onChange({ ...item, url: e.target.value })}
        className="text-xs"
      />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Context Wizard</DialogTitle>
          <DialogDescription>
            Provide comprehensive context to help the agent understand your brand, market, and assets.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-3 shrink-0">
              <TabsTrigger value="onSite">On-site</TabsTrigger>
              <TabsTrigger value="offSite">Off-site</TabsTrigger>
              <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto min-h-0">
              {/* On-site Tab */}
              <TabsContent value="onSite" className="space-y-6 p-4 m-0">
                {/* Brand Identity */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Briefcase className="h-5 w-5" /> Brand Identity
                  </h3>
                  <div className="grid gap-3">
                    <Input 
                      placeholder="Brand Name" 
                      value={contextData.onSite.brandInfo.name}
                      onChange={(e) => updateOnSite({ 
                        brandInfo: { ...contextData.onSite.brandInfo, name: e.target.value } 
                      })}
                    />
                    <Input 
                      placeholder="Tagline / Slogan" 
                      value={contextData.onSite.brandInfo.tagline || ""}
                      onChange={(e) => updateOnSite({ 
                        brandInfo: { ...contextData.onSite.brandInfo, tagline: e.target.value } 
                      })}
                    />
                    <Textarea 
                      placeholder="Mission, Vision, and Founding Story..." 
                      value={contextData.onSite.brandInfo.mission || ""}
                      onChange={(e) => updateOnSite({ 
                        brandInfo: { ...contextData.onSite.brandInfo, mission: e.target.value } 
                      })}
                      className="min-h-[100px]"
                    />
                  </div>
                </div>

                {/* Products & Services */}
                <ComplexListInput 
                  label="Products & Services"
                  items={contextData.onSite.productsServices}
                  onChange={(items) => updateOnSite({ productsServices: items })}
                  onRemove={(id) => updateOnSite({ 
                    productsServices: contextData.onSite.productsServices.filter((i: ProductService) => i.id !== id) 
                  })}
                  onAdd={() => updateOnSite({
                    productsServices: [...contextData.onSite.productsServices, {
                      id: uuidv4(),
                      name: "",
                      type: "product"
                    }]
                  })}
                  renderItem={renderProductService}
                />

                {/* Website Content */}
                <ComplexListInput 
                  label="Website Content Structure"
                  items={contextData.onSite.websiteContent}
                  onChange={(items) => updateOnSite({ websiteContent: items })}
                  onRemove={(id) => updateOnSite({ 
                    websiteContent: contextData.onSite.websiteContent.filter((i: WebsiteContent) => i.id !== id) 
                  })}
                  onAdd={() => updateOnSite({
                    websiteContent: [...contextData.onSite.websiteContent, {
                      id: uuidv4(),
                      name: "",
                      url: "",
                      type: "other"
                    }]
                  })}
                  renderItem={renderWebsiteContent}
                />

                {/* Landing Pages */}
                <ComplexListInput 
                  label="Landing Pages"
                  items={contextData.onSite.landingPages}
                  onChange={(items) => updateOnSite({ landingPages: items })}
                  onRemove={(id) => updateOnSite({ 
                    landingPages: contextData.onSite.landingPages.filter((i: LandingPage) => i.id !== id) 
                  })}
                  onAdd={() => updateOnSite({
                    landingPages: [...contextData.onSite.landingPages, {
                      id: uuidv4(),
                      name: "",
                      url: "",
                      type: "campaign",
                      status: "active",
                      createdAt: new Date().toISOString()
                    }]
                  })}
                  renderItem={renderLandingPage}
                />

                {/* Team Members */}
                <ComplexListInput 
                  label="Team & Culture"
                  items={contextData.onSite.team}
                  onChange={(items) => updateOnSite({ team: items })}
                  onRemove={(id) => updateOnSite({ 
                    team: contextData.onSite.team.filter((i: TeamMember) => i.id !== id) 
                  })}
                  onAdd={() => updateOnSite({
                    team: [...contextData.onSite.team, {
                      id: uuidv4(),
                      name: "",
                      role: ""
                    }]
                  })}
                  renderItem={renderTeamMember}
                />

                 <SimpleArrayInput
                  label="Blog Post URLs"
                  values={contextData.onSite.blogPosts.map((p: BlogPost) => p.url)}
                  onChange={(urls) => updateOnSite({ 
                    blogPosts: urls.map(url => ({ 
                      id: uuidv4(), 
                      url, 
                      title: "New Post", 
                      status: "published" 
                    })) 
                  })}
                  placeholder="https://your-site.com/blog/..."
                />
              </TabsContent>

              {/* Off-site Tab */}
              <TabsContent value="offSite" className="space-y-6 p-4 m-0">
                <ComplexListInput 
                  label="Official Accounts"
                  items={contextData.offSite.officialAccounts}
                  onChange={(items) => updateOffSite({ officialAccounts: items })}
                  onRemove={(id) => updateOffSite({ 
                    officialAccounts: contextData.offSite.officialAccounts.filter((i: OfficialAccount) => i.id !== id) 
                  })}
                  onAdd={() => updateOffSite({
                    officialAccounts: [...contextData.offSite.officialAccounts, {
                      id: uuidv4(),
                      platform: "twitter",
                      accountName: "",
                      url: ""
                    }]
                  })}
                  renderItem={renderOfficialAccount}
                />

                <ComplexListInput 
                  label="Partnerships"
                  items={contextData.offSite.partnerships}
                  onChange={(items) => updateOffSite({ partnerships: items })}
                  onRemove={(id) => updateOffSite({ 
                    partnerships: contextData.offSite.partnerships.filter((i: Partnership) => i.id !== id) 
                  })}
                  onAdd={() => updateOffSite({
                    partnerships: [...contextData.offSite.partnerships, {
                      id: uuidv4(),
                      name: "",
                      type: "technology",
                      status: "active"
                    }]
                  })}
                  renderItem={renderPartnership}
                />

                 <ComplexListInput 
                  label="Customer Reviews"
                  items={contextData.offSite.customerReviews}
                  onChange={(items) => updateOffSite({ customerReviews: items })}
                  onRemove={(id) => updateOffSite({ 
                    customerReviews: contextData.offSite.customerReviews.filter((i: CustomerReview) => i.id !== id) 
                  })}
                  onAdd={() => updateOffSite({
                    customerReviews: [...contextData.offSite.customerReviews, {
                      id: uuidv4(),
                      source: "",
                      content: ""
                    }]
                  })}
                  renderItem={renderCustomerReview}
                />

                <SimpleArrayInput
                  label="Press Releases / Media Coverage URLs"
                  values={contextData.offSite.pressReleases.map((p: PressRelease) => p.url)}
                  onChange={(urls) => updateOffSite({ 
                    pressReleases: urls.map(url => ({ 
                      id: uuidv4(), 
                      url, 
                      title: "New Press Release", 
                      source: "Unknown", 
                      type: "press_release" 
                    })) 
                  })}
                  placeholder="https://news-site.com/..."
                />

                <SimpleArrayInput
                  label="Social Media Content (Influencer/UGC) URLs"
                  values={contextData.offSite.socialMediaContent.map((p: SocialMediaContent) => p.contentUrl)}
                  onChange={(urls) => updateOffSite({ 
                    socialMediaContent: urls.map(url => ({ 
                      id: uuidv4(), 
                      contentUrl: url, 
                      platform: "unknown", 
                      type: "ugc", 
                      creatorName: "Unknown",
                      contentType: "post"
                    })) 
                  })}
                  placeholder="https://instagram.com/p/..."
                />
              </TabsContent>

              {/* Knowledge Tab */}
              <TabsContent value="knowledge" className="space-y-6 p-4 m-0">
                <ComplexListInput 
                  label="Competitor Monitoring"
                  items={contextData.knowledge.competitors}
                  onChange={(items) => updateKnowledge({ competitors: items })}
                  onRemove={(id) => updateKnowledge({ 
                    competitors: contextData.knowledge.competitors.filter((i: Competitor) => i.id !== id) 
                  })}
                  onAdd={() => updateKnowledge({
                    competitors: [...contextData.knowledge.competitors, {
                      id: uuidv4(),
                      name: "",
                      category: "direct",
                    }]
                  })}
                  renderItem={renderCompetitor}
                />

                <ComplexListInput 
                  label="Audience Personas"
                  items={contextData.knowledge.audiencePersonas}
                  onChange={(items) => updateKnowledge({ audiencePersonas: items })}
                  onRemove={(id) => updateKnowledge({ 
                    audiencePersonas: contextData.knowledge.audiencePersonas.filter((i: AudiencePersona) => i.id !== id) 
                  })}
                  onAdd={() => updateKnowledge({
                    audiencePersonas: [...contextData.knowledge.audiencePersonas, {
                      id: uuidv4(),
                      name: "",
                      description: ""
                    }]
                  })}
                  renderItem={renderPersona}
                />

                <ComplexListInput 
                  label="Market Intelligence"
                  items={contextData.knowledge.marketIntelligence}
                  onChange={(items) => updateKnowledge({ marketIntelligence: items })}
                  onRemove={(id) => updateKnowledge({ 
                    marketIntelligence: contextData.knowledge.marketIntelligence.filter((i: MarketIntelligence) => i.id !== id) 
                  })}
                  onAdd={() => updateKnowledge({
                    marketIntelligence: [...contextData.knowledge.marketIntelligence, {
                      id: uuidv4(),
                      title: "",
                      source: "",
                      type: "industry_report"
                    }]
                  })}
                  renderItem={renderMarketIntel}
                />

                <SimpleArrayInput
                  label="User Uploads (URLs)"
                  values={contextData.knowledge.userUploads.map((p: UserUpload) => p.url || "")}
                  onChange={(urls) => updateKnowledge({ 
                    userUploads: urls.map(url => ({ 
                      id: uuidv4(), 
                      fileName: "New Upload",
                      fileType: "other",
                      category: "internal_doc",
                      uploadedAt: new Date().toISOString(),
                      url
                    })) 
                  })}
                  placeholder="https://..."
                />

                <div className="pt-4 border-t">
                  <h3 className="text-sm font-semibold mb-2">Agent Generated Content</h3>
                  <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
                    {contextData.knowledge.agentGenerated.length === 0 
                      ? "No content generated yet. The agent will populate this automatically." 
                      : `${contextData.knowledge.agentGenerated.length} items generated.`}
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <DialogFooter className="pt-4 border-t">
          <Button onClick={() => onOpenChange(false)}>Save & Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


