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
  complexityScore: number;
  complexityLevel: "low" | "medium" | "high";
  strategicPriorities: string[];
  recommendedStartingPillar: "venue-first" | "theme-first";
  plannerInsight: string;
  normalizedContext: {
    location: string;
    guestCount: number;
    budgetMin: number;
    budgetMax: number;
    vibeWords: string[];
    nonNegotiable: string;
  };
};

type ContextWidgetPayload = {
  snapshot?: Snapshot;
  nextStep?: string;
};

const FALLBACK_SNAPSHOT: Snapshot = {
  budgetTierLabel: "Smart Luxury $40k - 120 guests",
  complexityScore: 57,
  complexityLevel: "medium",
  strategicPriorities: [
    "Food and beverage experience",
    "Visual elegance and styling",
    "Photography and storytelling",
  ],
  recommendedStartingPillar: "venue-first",
  plannerInsight:
    "Given your guest count (120) and budget range $35,000-$45,000, venue selection will likely drive about 45% of total spend and heavily shape theme decisions.",
  normalizedContext: {
    location: "Lisbon",
    guestCount: 120,
    budgetMin: 35000,
    budgetMax: 45000,
    vibeWords: ["modern", "romantic", "minimalist"],
    nonNegotiable: "Excellent food experience",
  },
};

function App() {
  const widgetProps = useWidgetProps<ContextWidgetPayload>(() => ({
    snapshot: FALLBACK_SNAPSHOT,
    nextStep:
      "Generate the venue strategy to shortlist venue types and set your booking timeline.",
  }));

  const snapshot = widgetProps.snapshot ?? FALLBACK_SNAPSHOT;
  const metrics: ArtifactMetric[] = [
    { label: "Budget tier", value: snapshot.budgetTierLabel },
    { label: "Complexity", value: `${snapshot.complexityLevel} (${snapshot.complexityScore}/100)` },
    { label: "Starting pillar", value: snapshot.recommendedStartingPillar },
  ];

  return (
    <ArtifactShell
      stepLabel="Step 1"
      title="Wedding Snapshot"
      summary="Core context that personalizes every downstream planning decision."
      metrics={metrics}
      nextStep={widgetProps.nextStep}
    >
      <ArtifactSection title="Strategic priorities">
        <div className="wedding-chip-row">
          {snapshot.strategicPriorities.map((priority) => (
            <TextChip key={priority}>{priority}</TextChip>
          ))}
        </div>
      </ArtifactSection>

      <ArtifactSection title="Vibe direction">
        <div className="wedding-chip-row">
          {snapshot.normalizedContext.vibeWords.map((word) => (
            <TextChip key={word}>{word}</TextChip>
          ))}
        </div>
      </ArtifactSection>

      <ArtifactSection title="Planner insight">
        <p className="wedding-copy">{snapshot.plannerInsight}</p>
      </ArtifactSection>

      <ArtifactSection title="Non-negotiable">
        <p className="wedding-copy">{snapshot.normalizedContext.nonNegotiable}</p>
      </ArtifactSection>
    </ArtifactShell>
  );
}

const root = document.getElementById("wedding-context-root");
if (root) {
  createRoot(root).render(<App />);
}
