export type WeddingSeason = "spring" | "summer" | "fall" | "winter";

export type WeddingPriority =
  | "food"
  | "party"
  | "elegance"
  | "intimacy"
  | "photos";

export type CoupleContextInput = {
  location: string;
  weddingDate?: string;
  weddingSeason?: WeddingSeason;
  guestCount: number;
  budgetMin: number;
  budgetMax: number;
  priorities: WeddingPriority[];
  vibeWords: string[];
  nonNegotiable: string;
};

export type WeddingSnapshot = {
  budgetTierLabel: string;
  complexityScore: number;
  complexityLevel: "low" | "medium" | "high";
  strategicPriorities: string[];
  recommendedStartingPillar: "venue-first" | "theme-first";
  plannerInsight: string;
  normalizedContext: CoupleContextInput;
};

export type VenueStrategyBrief = {
  recommendations: Array<{
    venueType: string;
    fitScore: number;
    whyItMatches: string[];
    budgetImpactTier: "$" | "$$" | "$$$";
    budgetShareRangePct: [number, number];
  }>;
  decisionChecklist: string[];
  venueTimeline: {
    bookingWindowMonthsBefore: [number, number];
    depositExpectationPct: [number, number];
    negotiationTips: string[];
    urgency: "normal" | "accelerated";
  };
  keyInsight: string;
};

export type BudgetArchitecture = {
  allocations: Array<{ category: string; percent: number; amountUsd: number }>;
  tradeoffInsights: string[];
  bufferPercent: 10;
};

export type DynamicTaskTimeline = {
  phases: Array<{ phase: string; window: string; tasks: string[] }>;
};

export type RiskRadar = {
  topRisks: Array<{
    risk: string;
    severity: "low" | "medium" | "high";
    reason: string;
    mitigation: string;
  }>;
};

export type DesignDirection = {
  colorPalette: string[];
  textures: string[];
  lightingStyle: string;
  floralDirection: string;
  dressCodeSuggestion: string;
  narrativeLine: string;
};

export type PlannerPitch = {
  openingVision: string;
  whyVenueFirst: string;
  budgetArchitectureSummary: string;
  designDirectionSummary: string;
  planningRoadmap: string[];
  confidenceClose: string;
  markdown: string;
};

export type BudgetPlanningBundle = {
  budgetArchitecture: BudgetArchitecture;
  dynamicTaskTimeline: DynamicTaskTimeline;
  riskRadar: RiskRadar;
};

export type WeddingPlanningBundle = {
  snapshot: WeddingSnapshot;
  venueStrategyBrief: VenueStrategyBrief;
  budgetPlanning: BudgetPlanningBundle;
  designDirection: DesignDirection;
  plannerPitch: PlannerPitch;
};
