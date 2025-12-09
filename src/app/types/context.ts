// src/app/types/context.ts

export type ContextStatus = "active" | "inactive" | "draft" | "archived" | "pending";
export type Sentiment = "positive" | "neutral" | "negative";
export type VerificationStatus = "verified" | "unverified";

// ---------------------------
// OnSite (Internal / Organization)
// ---------------------------

export interface BrandAsset {
  id: string;
  name: string;
  type:
  | "logo"
  | "color_palette"
  | "typography"
  | "icon"
  | "image"
  | "video"
  | "guideline"
  | "other";
  url?: string;
  description?: string;
  tags?: string[];
  createdAt: string;
}

export interface PricingPlan {
  name: string;      // e.g. "Free", "Pro", "Enterprise"
  price: string;     // e.g. "$0", "$29/mo", "Custom"
  features?: string[]; // Features included in this plan
}

export interface ProductService {
  id: string;
  name: string;
  type: "product" | "service" | "subscription";
  url?: string;
  description?: string;
  price?: string;           // Simple single price (legacy/simple use)
  pricingPlans?: PricingPlan[]; // Multiple pricing tiers
  features?: string[];
  benefits?: string[];
  howItWorks?: string[];
}

export interface LandingPage {
  id: string;
  name: string;
  url: string;
  type: "product" | "campaign" | "event" | "signup" | "download" | "other";
  status: ContextStatus;
  description?: string;
  createdAt: string;
}

export interface BlogPost {
  id: string;
  title: string;
  url: string;
  category?: string;
  status: "published" | "draft" | "archived";
  publishDate?: string;
  tags?: string[];
}

export interface WebsiteContent {
  id: string;
  name: string;
  url: string;
  type:
  | "home"
  | "about"
  | "pricing"
  | "faq"
  | "case_study"
  | "testimonial"
  | "documentation"
  | "career"
  | "legal"
  | "other";
  description?: string;
}

export interface BrandInfo {
  name: string;
  tagline?: string;
  mission?: string;
  vision?: string;
  coreValues?: string[];
  targetMarket?: string;
  uniqueSellingPoints?: string[];
  foundingStory?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio?: string;
  linkedin?: string;
}

export interface OnSiteContext {
  brandInfo: BrandInfo;
  brandAssets: BrandAsset[];
  productsServices: ProductService[];
  landingPages: LandingPage[];
  blogPosts: BlogPost[];
  websiteContent: WebsiteContent[];
  team: TeamMember[];
}

// ---------------------------
// OffSite (External / Market)
// ---------------------------

export interface PressRelease {
  id: string;
  title: string;
  url: string;
  type: "press_release" | "media_coverage" | "interview" | "news_mention";
  source: string;
  publishDate?: string;
  summary?: string;
  sentiment?: Sentiment;
}

export interface OfficialAccount {
  id: string;
  platform:
  | "wechat"
  | "weibo"
  | "douyin"
  | "xiaohongshu"
  | "bilibili"
  | "zhihu"
  | "linkedin"
  | "twitter"
  | "facebook"
  | "instagram"
  | "youtube"
  | "tiktok"
  | "other";
  accountName: string;
  url: string;
  followerCount?: number;
  verificationStatus?: VerificationStatus;
  description?: string;
}

export interface SocialMediaContent {
  id: string;
  platform: string;
  type: "kol" | "koc" | "ugc" | "paid_partnership";
  creatorName: string;
  contentUrl: string;
  contentType: "post" | "video" | "story" | "live" | "review";
  sentiment?: Sentiment;
  tags?: string[];
  description?: string;
}

export interface Partnership {
  id: string;
  name: string;
  type:
  | "distributor"
  | "reseller"
  | "affiliate"
  | "integration"
  | "media_partner"
  | "technology"
  | "other";
  url?: string;
  description?: string;
  status: "active" | "inactive" | "pending";
}

export interface CustomerReview {
  id: string;
  source: string;
  reviewerName?: string;
  rating?: number;
  content: string;
  date?: string;
  url?: string;
}

export interface OffSiteContext {
  officialAccounts: OfficialAccount[];
  pressReleases: PressRelease[];
  socialMediaContent: SocialMediaContent[];
  partnerships: Partnership[];
  customerReviews: CustomerReview[];
}

// ---------------------------
// Knowledge (Intelligence / Data)
// ---------------------------

export interface Competitor {
  id: string;
  name: string;
  website?: string;
  description?: string;
  category: "direct" | "indirect" | "potential";
  strengths?: string[];
  weaknesses?: string[];
  pricing?: string;
}

export interface UserUpload {
  id: string;
  fileName: string;
  fileType: "pdf" | "doc" | "ppt" | "xls" | "image" | "video" | "csv" | "txt" | "md" | "other";
  category:
  | "market_research"
  | "user_research"
  | "brand_guideline"
  | "competitor_analysis"
  | "internal_doc"
  | "report"
  | "data_set"
  | "other";
  description?: string;
  uploadedAt: string;
  url?: string;
  content?: string;
}

export interface AgentGeneratedContent {
  id: string;
  title: string;
  type: "analysis" | "strategy" | "content_draft" | "summary" | "recommendation" | "report";
  content: string;
  generatedAt: string;
  isSaved: boolean;
  tags?: string[];
}

export interface MarketIntelligence {
  id: string;
  title: string;
  type: "industry_report" | "market_trend" | "regulation" | "news" | "statistics";
  source: string;
  url?: string;
  summary?: string;
  year?: string;
}

export interface AudiencePersona {
  id: string;
  name: string;
  description: string;
  demographics?: string;
  painPoints?: string[];
  goals?: string[];
  buyingBehavior?: string;
}

export interface KnowledgeContext {
  competitors: Competitor[];
  audiencePersonas: AudiencePersona[];
  marketIntelligence: MarketIntelligence[];
  userUploads: UserUpload[];
  agentGenerated: AgentGeneratedContent[];
}

// ---------------------------
// Main Context Data
// ---------------------------

export interface ContextData {
  onSite: OnSiteContext;
  offSite: OffSiteContext;
  knowledge: KnowledgeContext;
  metadata: {
    lastUpdated: string;
    version: string;
  };
}

// ---------------------------
// Initial State
// ---------------------------

export const initialContextData: ContextData = {
  onSite: {
    brandInfo: { name: "" },
    brandAssets: [],
    productsServices: [],
    landingPages: [],
    blogPosts: [],
    websiteContent: [],
    team: [],
  },
  offSite: {
    officialAccounts: [],
    pressReleases: [],
    socialMediaContent: [],
    partnerships: [],
    customerReviews: [],
  },
  knowledge: {
    competitors: [],
    audiencePersonas: [],
    marketIntelligence: [],
    userUploads: [],
    agentGenerated: [],
  },
  metadata: {
    lastUpdated: new Date().toISOString(),
    version: "2.0.0",
  },
};



