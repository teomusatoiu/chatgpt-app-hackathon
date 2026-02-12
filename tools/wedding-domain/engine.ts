import { coupleContextInputSchema } from "./schemas";
import type {
  BudgetArchitecture,
  BudgetPlanningBundle,
  CoupleContextInput,
  DesignDirection,
  DynamicTaskTimeline,
  PlannerPitch,
  RiskRadar,
  VenueStrategyBrief,
  WeddingPlanningBundle,
  WeddingPriority,
  WeddingSeason,
  WeddingSnapshot,
} from "./types";

type VenueProfile = {
  venueType: string;
  vibes: string[];
  priorities: WeddingPriority[];
  budgetImpactTier: "$" | "$$" | "$$$";
  budgetShareRangePct: [number, number];
  capacityRange: [number, number];
  reasons: string[];
};

type NonBufferCategory =
  | "Venue"
  | "Catering"
  | "Photography"
  | "Attire"
  | "Decor"
  | "Entertainment"
  | "Planner";

const NON_BUFFER_CATEGORIES: NonBufferCategory[] = [
  "Venue",
  "Catering",
  "Photography",
  "Attire",
  "Decor",
  "Entertainment",
  "Planner",
];

const BASE_NON_BUFFER_WEIGHTS: Record<NonBufferCategory, number> = {
  Venue: 23,
  Catering: 25,
  Photography: 10,
  Attire: 8,
  Decor: 10,
  Entertainment: 8,
  Planner: 6,
};

const PRIORITY_MODIFIERS: Record<
  WeddingPriority,
  Partial<Record<NonBufferCategory, number>>
> = {
  food: {
    Catering: 4,
    Decor: -1,
    Entertainment: -1,
    Attire: -2,
  },
  party: {
    Entertainment: 4,
    Venue: 1,
    Decor: -2,
    Attire: -1,
    Planner: -2,
  },
  elegance: {
    Decor: 4,
    Attire: 2,
    Entertainment: -2,
    Planner: -2,
    Venue: -2,
  },
  intimacy: {
    Venue: 2,
    Decor: 1,
    Entertainment: -1,
    Catering: -1,
    Planner: -1,
  },
  photos: {
    Photography: 5,
    Decor: 1,
    Entertainment: -2,
    Venue: -2,
    Attire: -2,
  },
};

const STRATEGIC_PRIORITY_LABELS: Record<WeddingPriority, string> = {
  food: "Food and beverage experience",
  party: "Guest energy and celebration flow",
  elegance: "Visual elegance and styling",
  intimacy: "Intimate guest experience",
  photos: "Photography and storytelling",
};

const VIBE_LIBRARY: Record<
  string,
  {
    colorPalette: string[];
    textures: string[];
    lighting: string;
    floral: string;
    dressCode: string;
  }
> = {
  modern: {
    colorPalette: ["warm white", "graphite", "champagne gold"],
    textures: ["polished stone", "brushed metal", "smooth linen"],
    lighting: "architectural pin-spot lighting with soft perimeter wash",
    floral: "sculptural blooms with minimal greenery",
    dressCode: "Modern cocktail attire",
  },
  rustic: {
    colorPalette: ["sage", "terracotta", "soft ivory"],
    textures: ["raw wood", "matte ceramics", "natural linen"],
    lighting: "warm festoon lighting and layered candlelight",
    floral: "garden florals with textural greenery",
    dressCode: "Formal garden attire",
  },
  romantic: {
    colorPalette: ["blush", "ivory", "dusty rose"],
    textures: ["silk", "velvet ribbon", "handmade paper"],
    lighting: "candle-forward glow with soft uplighting",
    floral: "soft ivory florals with trailing accents",
    dressCode: "Romantic formal attire",
  },
  minimalist: {
    colorPalette: ["bone", "taupe", "charcoal"],
    textures: ["smooth plaster", "fine cotton", "matte ceramics"],
    lighting: "clean directional lighting with restrained contrast",
    floral: "single-varietal florals with structured greenery",
    dressCode: "Minimal formal attire",
  },
  dramatic: {
    colorPalette: ["black", "oxblood", "antique gold"],
    textures: ["velvet", "smoked glass", "aged brass"],
    lighting: "high-contrast pools of light with dark surround",
    floral: "moody florals with deep tonal foliage",
    dressCode: "Black-tie optional",
  },
};

const VENUE_PROFILES: VenueProfile[] = [
  {
    venueType: "Estate",
    vibes: ["romantic", "elegance", "classic", "rustic"],
    priorities: ["elegance", "photos", "intimacy"],
    budgetImpactTier: "$$$",
    budgetShareRangePct: [45, 58],
    capacityRange: [70, 220],
    reasons: [
      "Built-in architecture reduces decor load while maintaining visual impact.",
      "Excellent natural backdrops for portraits and ceremony moments.",
    ],
  },
  {
    venueType: "Boutique hotel",
    vibes: ["modern", "elegance", "romantic", "minimalist"],
    priorities: ["food", "party", "elegance"],
    budgetImpactTier: "$$$",
    budgetShareRangePct: [42, 55],
    capacityRange: [60, 180],
    reasons: [
      "Integrated catering and logistics simplify coordination.",
      "Consistent service operations help preserve guest experience quality.",
    ],
  },
  {
    venueType: "Industrial loft",
    vibes: ["modern", "minimalist", "dramatic"],
    priorities: ["party", "photos", "elegance"],
    budgetImpactTier: "$$",
    budgetShareRangePct: [38, 48],
    capacityRange: [80, 260],
    reasons: [
      "Open layout supports flexible dance floor and guest flow design.",
      "Neutral shell allows strong creative direction without visual clutter.",
    ],
  },
  {
    venueType: "Garden venue",
    vibes: ["romantic", "rustic", "intimacy", "minimalist"],
    priorities: ["intimacy", "photos", "food"],
    budgetImpactTier: "$$",
    budgetShareRangePct: [40, 52],
    capacityRange: [40, 160],
    reasons: [
      "Outdoor atmosphere supports an intimate and naturally immersive mood.",
      "Natural light improves daytime photography quality.",
    ],
  },
  {
    venueType: "Historic villa",
    vibes: ["romantic", "dramatic", "elegance", "classic"],
    priorities: ["elegance", "photos", "food"],
    budgetImpactTier: "$$$",
    budgetShareRangePct: [44, 57],
    capacityRange: [50, 180],
    reasons: [
      "Character-rich interiors elevate storytelling and guest perception.",
      "Distinct ceremony and reception zones support cleaner timeline flow.",
    ],
  },
  {
    venueType: "Private club",
    vibes: ["classic", "modern", "elegance", "intimacy"],
    priorities: ["food", "intimacy", "party"],
    budgetImpactTier: "$$",
    budgetShareRangePct: [39, 50],
    capacityRange: [40, 140],
    reasons: [
      "Controlled guest count creates a high-touch hospitality experience.",
      "Predictable operations reduce execution risk on event day.",
    ],
  },
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function parseWeddingDate(date?: string): Date | null {
  if (!date) {
    return null;
  }

  const parsed = new Date(`${date}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toMonthDifference(targetDate: Date, now = new Date()): number {
  const yearDelta = targetDate.getUTCFullYear() - now.getUTCFullYear();
  const monthDelta = targetDate.getUTCMonth() - now.getUTCMonth();
  const rawMonths = yearDelta * 12 + monthDelta;

  if (targetDate.getUTCDate() < now.getUTCDate()) {
    return rawMonths - 1;
  }

  return rawMonths;
}

function inferSeasonFromDate(date: Date): WeddingSeason {
  const month = date.getUTCMonth();
  if (month >= 2 && month <= 4) {
    return "spring";
  }
  if (month >= 5 && month <= 7) {
    return "summer";
  }
  if (month >= 8 && month <= 10) {
    return "fall";
  }
  return "winter";
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatMonthYear(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function subtractMonths(date: Date, months: number): Date {
  const next = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  next.setUTCMonth(next.getUTCMonth() - months);
  return next;
}

function uniqueList(values: string[]): string[] {
  return Array.from(new Set(values));
}

function normalizeVibes(vibeWords: string[]): string[] {
  return vibeWords
    .map((word) => word.trim().toLowerCase())
    .filter((word) => word.length > 0);
}

function getBudgetTier(perGuestMidpoint: number): string {
  if (perGuestMidpoint < 250) {
    return "Essential";
  }
  if (perGuestMidpoint < 600) {
    return "Smart Luxury";
  }
  if (perGuestMidpoint < 1000) {
    return "Elevated";
  }
  return "Prestige";
}

function getGuestLoadScore(guestCount: number): number {
  if (guestCount <= 50) {
    return 10;
  }
  if (guestCount <= 100) {
    return 22;
  }
  if (guestCount <= 150) {
    return 32;
  }
  return 42;
}

function getPriorityPressure(priorities: WeddingPriority[]): number {
  const focusSet = new Set<WeddingPriority>(["food", "party", "photos"]);
  const overlap = priorities.filter((priority) => focusSet.has(priority)).length;
  return overlap >= 2 ? 8 : 4;
}

function getNonNegotiablePressure(nonNegotiable: string): number {
  const normalized = nonNegotiable.toLowerCase();
  const highPressurePatterns = [
    /destination/,
    /outdoor/,
    /specific vendor/,
    /custom tradition/,
    /religious tradition/,
  ];

  return highPressurePatterns.some((pattern) => pattern.test(normalized)) ? 10 : 5;
}

function getComplexityLevel(score: number): "low" | "medium" | "high" {
  if (score <= 34) {
    return "low";
  }
  if (score <= 64) {
    return "medium";
  }
  return "high";
}

function getVenueSpendInfluencePct(guestCount: number): number {
  if (guestCount <= 60) {
    return 40;
  }
  if (guestCount <= 120) {
    return 45;
  }
  if (guestCount <= 180) {
    return 52;
  }
  return 60;
}

function getTimelinePressure(date: Date | null): number {
  if (!date) {
    return 7;
  }

  return toMonthDifference(date) <= 10 ? 12 : 7;
}

function getSeasonPressure(season: WeddingSeason): number {
  return season === "summer" || season === "fall" ? 10 : 6;
}

function getNormalizedSeason(context: CoupleContextInput): WeddingSeason {
  if (context.weddingSeason) {
    return context.weddingSeason;
  }

  const parsedDate = parseWeddingDate(context.weddingDate);
  if (!parsedDate) {
    return "spring";
  }

  return inferSeasonFromDate(parsedDate);
}

function normalizePercents(
  weights: Record<NonBufferCategory, number>,
  targetTotal: number,
): Record<NonBufferCategory, number> {
  const sum = NON_BUFFER_CATEGORIES.reduce((running, key) => running + weights[key], 0);
  const scaled: Record<NonBufferCategory, number> = { ...weights };

  NON_BUFFER_CATEGORIES.forEach((key) => {
    const normalized = (weights[key] / sum) * targetTotal;
    scaled[key] = Math.round(normalized * 10) / 10;
  });

  const current = NON_BUFFER_CATEGORIES.reduce((running, key) => running + scaled[key], 0);
  const diff = Math.round((targetTotal - current) * 10) / 10;

  if (diff !== 0) {
    const largestCategory = NON_BUFFER_CATEGORIES.reduce((best, key) =>
      scaled[key] > scaled[best] ? key : best,
    );
    scaled[largestCategory] = Math.round((scaled[largestCategory] + diff) * 10) / 10;
  }

  return scaled;
}

function getSecondaryTradeoff(priority: WeddingPriority): string {
  switch (priority) {
    case "food":
      return "Elevating catering by 5% usually requires pulling from entertainment pacing or reducing premium bar duration.";
    case "party":
      return "Adding premium entertainment and production often reduces flexibility in decor scale unless total budget increases.";
    case "elegance":
      return "A high-design decor concept typically compresses funds available for live entertainment upgrades.";
    case "intimacy":
      return "Investing in guest comfort upgrades can reduce headroom for large-format production elements.";
    case "photos":
      return "Moving photography from mid-tier to premium often requires trimming venue embellishments and custom signage.";
    default:
      return "When one pillar scales up, protect the 10% buffer first to avoid downstream decision stress.";
  }
}

function getRiskSeverityWeight(severity: "low" | "medium" | "high"): number {
  if (severity === "high") {
    return 3;
  }
  if (severity === "medium") {
    return 2;
  }
  return 1;
}

function getDateWindowLabel(
  context: CoupleContextInput,
  startMonthsOut: number,
  endMonthsOut: number,
): string {
  const weddingDate = parseWeddingDate(context.weddingDate);

  if (weddingDate) {
    const startDate = subtractMonths(weddingDate, startMonthsOut);
    const endDate = subtractMonths(weddingDate, endMonthsOut);
    return `${formatMonthYear(startDate)} - ${formatMonthYear(endDate)}`;
  }

  const season = context.weddingSeason ?? "spring";
  if (endMonthsOut === 0) {
    return `${startMonthsOut} months out to wedding (${season})`;
  }

  return `${startMonthsOut}-${endMonthsOut} months out (${season})`;
}

function scoreVenueFit(
  profile: VenueProfile,
  context: CoupleContextInput,
  normalizedVibes: string[],
): number {
  const vibeHits = profile.vibes.filter((vibe) =>
    normalizedVibes.some((word) => word.includes(vibe) || vibe.includes(word)),
  ).length;
  const priorityHits = profile.priorities.filter((priority) =>
    context.priorities.includes(priority),
  ).length;

  const guestCount = context.guestCount;
  const [minCapacity, maxCapacity] = profile.capacityRange;
  const capacityAdjustment =
    guestCount < minCapacity ? -4 : guestCount > maxCapacity ? -6 : 8;

  return clamp(52 + vibeHits * 9 + priorityHits * 10 + capacityAdjustment, 55, 98);
}

function getDefaultDesignDirection(): DesignDirection {
  return {
    colorPalette: ["ivory", "sand", "warm taupe"],
    textures: ["linen", "stone", "matte ceramic"],
    lightingStyle: "warm layered candlelight with soft ambient wash",
    floralDirection: "ivory florals with structured greenery",
    dressCodeSuggestion: "Formal attire",
    narrativeLine:
      "Soft ivory florals with structured greenery over warm stone textures create a calm, elegant atmosphere that feels timeless in photographs.",
  };
}

export function normalizeContext(input: CoupleContextInput): CoupleContextInput {
  return coupleContextInputSchema.parse(input);
}

export function buildWeddingSnapshot(input: CoupleContextInput): WeddingSnapshot {
  const context = normalizeContext(input);
  const midpointBudget = (context.budgetMin + context.budgetMax) / 2;
  const perGuestMidpoint = midpointBudget / context.guestCount;
  const budgetTier = getBudgetTier(perGuestMidpoint);
  const season = getNormalizedSeason(context);
  const weddingDate = parseWeddingDate(context.weddingDate);

  const complexityScore = clamp(
    getGuestLoadScore(context.guestCount) +
      getTimelinePressure(weddingDate) +
      getSeasonPressure(season) +
      getPriorityPressure(context.priorities) +
      getNonNegotiablePressure(context.nonNegotiable),
    0,
    100,
  );

  const complexityLevel = getComplexityLevel(complexityScore);
  const strategicPriorities = context.priorities
    .slice(0, 3)
    .map((priority) => STRATEGIC_PRIORITY_LABELS[priority]);
  const recommendedStartingPillar =
    context.guestCount <= 60 &&
    perGuestMidpoint >= 700 &&
    (context.priorities.includes("elegance") || context.priorities.includes("intimacy"))
      ? "theme-first"
      : "venue-first";

  const influencePct = getVenueSpendInfluencePct(context.guestCount);
  const budgetTierLabel = `${budgetTier} $${Math.round(midpointBudget / 1000)}k - ${context.guestCount} guests`;
  const plannerInsight =
    `Given your guest count (${context.guestCount}) and budget range ` +
    `${formatCurrency(context.budgetMin)}-${formatCurrency(context.budgetMax)}, ` +
    `venue selection will likely drive about ${influencePct}% of total spend and heavily shape theme decisions.`;

  return {
    budgetTierLabel,
    complexityScore,
    complexityLevel,
    strategicPriorities,
    recommendedStartingPillar,
    plannerInsight,
    normalizedContext: context,
  };
}

export function buildVenueStrategyBrief(
  input: CoupleContextInput,
  snapshotOverride?: WeddingSnapshot,
): VenueStrategyBrief {
  const snapshot = snapshotOverride ?? buildWeddingSnapshot(input);
  const context = snapshot.normalizedContext;
  const normalizedVibes = normalizeVibes(context.vibeWords);

  const ranked = VENUE_PROFILES.map((profile) => {
    const fitScore = scoreVenueFit(profile, context, normalizedVibes);
    const vibeHits = profile.vibes.filter((vibe) =>
      normalizedVibes.some((word) => word.includes(vibe) || vibe.includes(word)),
    );
    const whyItMatches = uniqueList([
      ...profile.reasons,
      vibeHits.length > 0
        ? `Matches your vibe direction: ${vibeHits.slice(0, 2).join(" and ")}.`
        : "Provides a flexible canvas for your selected aesthetic direction.",
      `Supports your ${context.guestCount}-guest layout with practical flow for ceremony and reception transitions.`,
    ]).slice(0, 3);

    return {
      venueType: profile.venueType,
      fitScore,
      whyItMatches,
      budgetImpactTier: profile.budgetImpactTier,
      budgetShareRangePct: profile.budgetShareRangePct,
    };
  })
    .sort((left, right) => right.fitScore - left.fitScore)
    .slice(0, 3);

  const bookingWindowMonthsBefore: [number, number] =
    snapshot.complexityLevel === "high"
      ? [12, 14]
      : snapshot.complexityLevel === "medium"
      ? [10, 12]
      : [8, 10];

  const weddingDate = parseWeddingDate(context.weddingDate);
  const monthsToWedding = weddingDate ? toMonthDifference(weddingDate) : null;
  const urgency: "normal" | "accelerated" =
    monthsToWedding !== null && monthsToWedding < bookingWindowMonthsBefore[0]
      ? "accelerated"
      : "normal";

  const influencePct = getVenueSpendInfluencePct(context.guestCount);
  const rangeMin = clamp(influencePct - 5, 40, 55);
  const rangeMax = clamp(influencePct + 5, 45, 60);

  return {
    recommendations: ranked,
    decisionChecklist: [
      "Capacity vs comfort",
      "Catering restrictions",
      "Weather contingency",
      "Vendor flexibility",
      "Hidden costs",
    ],
    venueTimeline: {
      bookingWindowMonthsBefore,
      depositExpectationPct: [20, 40],
      negotiationTips: [
        "Ask for weekday or shoulder-season leverage before committing to premium dates.",
        "Negotiate package inclusions (furniture, lighting, staffing) before rate reductions.",
        "Confirm service charges and overtime triggers in writing before deposit transfer.",
      ],
      urgency,
    },
    keyInsight:
      `Venue selection locks in date, vibe, layout, and lighting, and will likely control about ${rangeMin}-${rangeMax}% ` +
      "of your total budget. It is the structural backbone of this plan.",
  };
}

export function buildBudgetPlanningBundle(
  input: CoupleContextInput,
  snapshotOverride?: WeddingSnapshot,
): BudgetPlanningBundle {
  const snapshot = snapshotOverride ?? buildWeddingSnapshot(input);
  const context = snapshot.normalizedContext;
  const midpointBudget = Math.round((context.budgetMin + context.budgetMax) / 2);

  const adjustedWeights: Record<NonBufferCategory, number> = {
    ...BASE_NON_BUFFER_WEIGHTS,
  };

  context.priorities.forEach((priority) => {
    const modifiers = PRIORITY_MODIFIERS[priority];
    NON_BUFFER_CATEGORIES.forEach((category) => {
      adjustedWeights[category] += modifiers[category] ?? 0;
      adjustedWeights[category] = Math.max(4, adjustedWeights[category]);
    });
  });

  const normalizedWeights = normalizePercents(adjustedWeights, 90);

  const allocations: BudgetArchitecture["allocations"] = NON_BUFFER_CATEGORIES.map(
    (category) => ({
      category,
      percent: normalizedWeights[category],
      amountUsd: Math.round((midpointBudget * normalizedWeights[category]) / 100),
    }),
  );

  const nonBufferAmount = allocations.reduce((sum, item) => sum + item.amountUsd, 0);
  const bufferAmount = midpointBudget - nonBufferAmount;

  allocations.push({
    category: "Buffer",
    percent: 10,
    amountUsd: bufferAmount,
  });

  const budgetArchitecture: BudgetArchitecture = {
    allocations,
    tradeoffInsights: [
      "If you increase decor by $3k, photography quality tier is likely to shift from premium to mid-tier unless overall budget expands.",
      getSecondaryTradeoff(context.priorities[0] ?? "food"),
    ],
    bufferPercent: 10,
  };

  const dynamicTaskTimeline: DynamicTaskTimeline = {
    phases: [
      {
        phase: "12-9 months",
        window: getDateWindowLabel(context, 12, 9),
        tasks: ["Venue booking", "Planner selection", "Photographer booking"],
      },
      {
        phase: "9-6 months",
        window: getDateWindowLabel(context, 9, 6),
        tasks: ["Catering decisions", "Design concept", "Attire planning"],
      },
      {
        phase: "6-3 months",
        window: getDateWindowLabel(context, 6, 3),
        tasks: ["Invitations", "Guest logistics", "Vendor timeline alignment"],
      },
      {
        phase: "3 months to wedding",
        window: getDateWindowLabel(context, 3, 0),
        tasks: ["Vendor confirmations", "Final fittings", "Run-of-show finalization"],
      },
    ],
  };

  const season = getNormalizedSeason(context);
  const weddingDate = parseWeddingDate(context.weddingDate);
  const monthsToWedding = weddingDate ? toMonthDifference(weddingDate) : 12;
  const budgetSpreadPct = (context.budgetMax - context.budgetMin) / Math.max(context.budgetMax, 1);

  const peakAvailabilitySeverity: "low" | "medium" | "high" =
    season === "summer" || season === "fall"
      ? monthsToWedding < 10
        ? "high"
        : "medium"
      : monthsToWedding < 8
      ? "medium"
      : "low";

  const budgetCreepSeverity: "low" | "medium" | "high" =
    snapshot.complexityLevel === "high" || budgetSpreadPct < 0.18
      ? "high"
      : snapshot.complexityLevel === "medium"
      ? "medium"
      : "low";

  const guestLogisticsSeverity: "low" | "medium" | "high" =
    context.guestCount > 150 ? "high" : context.guestCount > 90 ? "medium" : "low";

  const topRisks = [
    {
      risk: "Peak season availability",
      severity: peakAvailabilitySeverity,
      reason:
        season === "summer" || season === "fall"
          ? "High-demand months compress venue and vendor options early."
          : "Vendor calendars still tighten quickly when date options are narrow.",
      mitigation:
        "Lock venue shortlist quickly and hold primary/backup dates before design commitments.",
    },
    {
      risk: "Budget creep",
      severity: budgetCreepSeverity,
      reason:
        budgetSpreadPct < 0.18
          ? "A narrow budget band leaves less room for late-stage upgrades."
          : "Priority-driven upgrades can compound if contingency is not protected.",
      mitigation:
        "Freeze category caps after venue contract and preserve the 10% buffer as non-negotiable.",
    },
    {
      risk: "Guest logistics",
      severity: guestLogisticsSeverity,
      reason:
        context.guestCount > 120
          ? "Larger guest movement and accommodation coordination adds execution complexity."
          : "Travel, timing, and communication details can still create friction for key guests.",
      mitigation:
        "Publish transport/accommodation guidance early and assign ownership for RSVP follow-ups.",
    },
  ].sort(
    (left, right) =>
      getRiskSeverityWeight(right.severity) - getRiskSeverityWeight(left.severity),
  );

  const riskRadar: RiskRadar = { topRisks: topRisks.slice(0, 3) };

  return {
    budgetArchitecture,
    dynamicTaskTimeline,
    riskRadar,
  };
}

export function buildDesignDirection(input: CoupleContextInput): DesignDirection {
  const context = normalizeContext(input);
  const normalizedVibes = normalizeVibes(context.vibeWords);

  const matchedProfiles = normalizedVibes
    .map((word) => VIBE_LIBRARY[word])
    .filter((profile): profile is (typeof VIBE_LIBRARY)[string] => Boolean(profile));

  if (matchedProfiles.length === 0) {
    return getDefaultDesignDirection();
  }

  const colorPalette = uniqueList(
    matchedProfiles.flatMap((profile) => profile.colorPalette),
  ).slice(0, 4);
  const textures = uniqueList(
    matchedProfiles.flatMap((profile) => profile.textures),
  ).slice(0, 4);
  const lightingStyle = matchedProfiles[0].lighting;
  const floralDirection = matchedProfiles[0].floral;

  const dressCodeSuggestion =
    matchedProfiles.find((profile) => profile.dressCode.includes("Black-tie"))
      ?.dressCode ?? matchedProfiles[0].dressCode;

  const narrativeLine =
    `${colorPalette[0]} and ${colorPalette[1] ?? colorPalette[0]} tones layered over ` +
    `${textures[0]} textures, paired with ${lightingStyle}, create a tangible atmosphere ` +
    "that feels cohesive from ceremony through reception.";

  return {
    colorPalette,
    textures,
    lightingStyle,
    floralDirection,
    dressCodeSuggestion,
    narrativeLine,
  };
}

export function buildPlannerPitch(input: CoupleContextInput): PlannerPitch {
  const snapshot = buildWeddingSnapshot(input);
  const venueStrategy = buildVenueStrategyBrief(snapshot.normalizedContext, snapshot);
  const budgetPlanning = buildBudgetPlanningBundle(snapshot.normalizedContext, snapshot);
  const designDirection = buildDesignDirection(snapshot.normalizedContext);

  const topAllocations = budgetPlanning.budgetArchitecture.allocations
    .filter((item) => item.category !== "Buffer")
    .sort((left, right) => right.percent - left.percent)
    .slice(0, 3)
    .map((item) => `${item.category} (${item.percent}%)`)
    .join(", ");

  const topVenue = venueStrategy.recommendations[0]?.venueType ?? "venue";
  const location = snapshot.normalizedContext.location;
  const vibeWords = snapshot.normalizedContext.vibeWords.slice(0, 3).join(", ");

  const openingVision =
    `Based on your plan for ${location}, with ${snapshot.normalizedContext.guestCount} guests and a ${vibeWords} direction, ` +
    "I recommend anchoring decisions around a venue that naturally supports your guest experience and design goals.";

  const whyVenueFirst =
    `Starting with the venue sets scale, confirms the date, and frames layout and lighting constraints. ` +
    `For your profile, this decision is expected to influence ${getVenueSpendInfluencePct(snapshot.normalizedContext.guestCount)}% ` +
    "of total spend and determines how flexible downstream design choices remain.";

  const budgetArchitectureSummary =
    `Your budget architecture prioritizes ${topAllocations}, while preserving a protected 10% buffer to control risk and avoid late-stage churn.`;

  const designDirectionSummary =
    `${designDirection.narrativeLine} Floral direction: ${designDirection.floralDirection}. ` +
    `Dress code recommendation: ${designDirection.dressCodeSuggestion}.`;

  const planningRoadmap = [
    `Shortlist and tour 5 ${topVenue.toLowerCase()} options within 3 weeks.`,
    "Lock photographer within 4 weeks of venue booking.",
    "Finalize aesthetic moodboard before catering tastings.",
  ];

  const confidenceClose =
    "The key to reducing stress is sequencing decisions correctly. We anchor the structure first (venue), align budget second, and let design flourish within that framework.";

  const markdown = [
    "## Opening Vision",
    openingVision,
    "",
    "## Why We Start with the Venue",
    whyVenueFirst,
    "",
    "## Your Budget Architecture",
    budgetArchitectureSummary,
    "",
    "## Design Direction",
    designDirectionSummary,
    "",
    "## Planning Roadmap",
    `1. ${planningRoadmap[0]}`,
    `2. ${planningRoadmap[1]}`,
    `3. ${planningRoadmap[2]}`,
    "",
    "## Close with Confidence",
    confidenceClose,
  ].join("\n");

  return {
    openingVision,
    whyVenueFirst,
    budgetArchitectureSummary,
    designDirectionSummary,
    planningRoadmap,
    confidenceClose,
    markdown,
  };
}

export function buildWeddingPlanningBundle(input: CoupleContextInput): WeddingPlanningBundle {
  const snapshot = buildWeddingSnapshot(input);
  const venueStrategyBrief = buildVenueStrategyBrief(snapshot.normalizedContext, snapshot);
  const budgetPlanning = buildBudgetPlanningBundle(snapshot.normalizedContext, snapshot);
  const designDirection = buildDesignDirection(snapshot.normalizedContext);
  const plannerPitch = buildPlannerPitch(snapshot.normalizedContext);

  return {
    snapshot,
    venueStrategyBrief,
    budgetPlanning,
    designDirection,
    plannerPitch,
  };
}
