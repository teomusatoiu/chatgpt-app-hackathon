import { createRoot } from "react-dom/client";
import { useWidgetProps } from "../hooks/use-widget-props";
import {
  ArtifactSection,
  ArtifactShell,
  type ArtifactMetric,
  TextChip,
} from "../wedding-shared/ArtifactShell";

type Snapshot = {
  budgetTierLabel: string;
  complexityLevel: "low" | "medium" | "high";
};

type VenueRecommendation = {
  venueType: string;
  fitScore: number;
  whyItMatches: string[];
  budgetImpactTier: "$" | "$$" | "$$$";
  budgetShareRangePct: [number, number];
};

type VenueStrategyBrief = {
  recommendations: VenueRecommendation[];
  decisionChecklist: string[];
  venueTimeline: {
    bookingWindowMonthsBefore: [number, number];
    depositExpectationPct: [number, number];
    negotiationTips: string[];
    urgency: "normal" | "accelerated";
  };
  keyInsight: string;
};

type VenueWidgetPayload = {
  snapshot?: Snapshot;
  venueStrategyBrief?: VenueStrategyBrief;
  nextStep?: string;
};

const FALLBACK_PAYLOAD: Required<VenueWidgetPayload> = {
  snapshot: {
    budgetTierLabel: "Smart Luxury $40k - 120 guests",
    complexityLevel: "medium",
  },
  venueStrategyBrief: {
    recommendations: [
      {
        venueType: "Boutique hotel",
        fitScore: 91,
        whyItMatches: [
          "Integrated catering and logistics simplify coordination.",
          "Matches your vibe direction: modern and romantic.",
          "Supports your 120-guest layout with practical event flow.",
        ],
        budgetImpactTier: "$$$",
        budgetShareRangePct: [42, 55],
      },
      {
        venueType: "Historic villa",
        fitScore: 88,
        whyItMatches: [
          "Character-rich interiors elevate storytelling.",
          "Distinct zones support cleaner timeline flow.",
          "Strong architectural value lowers decor pressure.",
        ],
        budgetImpactTier: "$$$",
        budgetShareRangePct: [44, 57],
      },
      {
        venueType: "Industrial loft",
        fitScore: 82,
        whyItMatches: [
          "Open layout supports dance floor and guest circulation.",
          "Flexible shell aligns with minimalist styling.",
          "Good fit for evening lighting design.",
        ],
        budgetImpactTier: "$$",
        budgetShareRangePct: [38, 48],
      },
    ],
    decisionChecklist: [
      "Capacity vs comfort",
      "Catering restrictions",
      "Weather contingency",
      "Vendor flexibility",
      "Hidden costs",
    ],
    venueTimeline: {
      bookingWindowMonthsBefore: [10, 12],
      depositExpectationPct: [20, 40],
      negotiationTips: [
        "Use shoulder-season dates for leverage.",
        "Negotiate package inclusions before base rate discounts.",
        "Confirm overtime and service charge terms in writing.",
      ],
      urgency: "normal",
    },
    keyInsight:
      "Venue selection locks in date, vibe, layout, and lighting, and typically controls 45-55% of total budget.",
  },
  nextStep:
    "Build your budget architecture to allocate spend, timeline, and risk controls.",
};

function App() {
  const widgetProps = useWidgetProps<VenueWidgetPayload>(() => FALLBACK_PAYLOAD);
  const snapshot = widgetProps.snapshot ?? FALLBACK_PAYLOAD.snapshot;
  const venue = widgetProps.venueStrategyBrief ?? FALLBACK_PAYLOAD.venueStrategyBrief;

  const metrics: ArtifactMetric[] = [
    { label: "Budget tier", value: snapshot.budgetTierLabel },
    { label: "Complexity", value: snapshot.complexityLevel },
    {
      label: "Booking window",
      value: `${venue.venueTimeline.bookingWindowMonthsBefore[0]}-${venue.venueTimeline.bookingWindowMonthsBefore[1]} months out`,
    },
  ];

  return (
    <ArtifactShell
      stepLabel="Step 2"
      title="Venue Strategy Brief"
      summary="Recommended venue directions with practical decision and timeline guardrails."
      metrics={metrics}
      nextStep={widgetProps.nextStep ?? FALLBACK_PAYLOAD.nextStep}
    >
      <ArtifactSection title="Venue recommendations">
        <div className="wedding-stack">
          {venue.recommendations.map((item) => (
            <article key={item.venueType} className="wedding-article">
              <header className="wedding-article-header">
                <h3>{item.venueType}</h3>
                <div className="wedding-chip-row">
                  <TextChip>{`Fit ${item.fitScore}`}</TextChip>
                  <TextChip>{item.budgetImpactTier}</TextChip>
                  <TextChip>{`${item.budgetShareRangePct[0]}-${item.budgetShareRangePct[1]}%`}</TextChip>
                </div>
              </header>
              <ul className="wedding-list">
                {item.whyItMatches.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </ArtifactSection>

      <ArtifactSection title="Decision checklist">
        <div className="wedding-chip-row">
          {venue.decisionChecklist.map((item) => (
            <TextChip key={item}>{item}</TextChip>
          ))}
        </div>
      </ArtifactSection>

      <ArtifactSection title="Venue timeline">
        <p className="wedding-copy">
          {`Target booking ${venue.venueTimeline.bookingWindowMonthsBefore[0]}-${venue.venueTimeline.bookingWindowMonthsBefore[1]} months before the wedding.`}
        </p>
        <p className="wedding-copy">
          {`Deposits are typically ${venue.venueTimeline.depositExpectationPct[0]}-${venue.venueTimeline.depositExpectationPct[1]}%. Urgency: ${venue.venueTimeline.urgency}.`}
        </p>
        <ul className="wedding-list">
          {venue.venueTimeline.negotiationTips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </ArtifactSection>

      <ArtifactSection title="Key insight">
        <p className="wedding-copy">{venue.keyInsight}</p>
      </ArtifactSection>
    </ArtifactShell>
  );
}

const root = document.getElementById("wedding-venue-strategy-root");
if (root) {
  createRoot(root).render(<App />);
}
