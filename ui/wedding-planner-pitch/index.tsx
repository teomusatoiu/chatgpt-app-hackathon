import { createRoot } from "react-dom/client";
import { useWidgetProps } from "../hooks/use-widget-props";
import {
  ArtifactSection,
  ArtifactShell,
  type ArtifactMetric,
} from "../wedding-shared/ArtifactShell";

type Snapshot = {
  budgetTierLabel: string;
  normalizedContext: { location: string; guestCount: number };
};

type PlannerPitch = {
  openingVision: string;
  whyVenueFirst: string;
  budgetArchitectureSummary: string;
  designDirectionSummary: string;
  planningRoadmap: string[];
  confidenceClose: string;
  markdown: string;
};

type PitchWidgetPayload = {
  snapshot?: Snapshot;
  plannerPitch?: PlannerPitch;
};

const FALLBACK_PAYLOAD: Required<PitchWidgetPayload> = {
  snapshot: {
    budgetTierLabel: "Smart Luxury $40k - 120 guests",
    normalizedContext: {
      location: "Lisbon",
      guestCount: 120,
    },
  },
  plannerPitch: {
    openingVision:
      "Based on your plan for Lisbon, with 120 guests and a modern romantic direction, I recommend anchoring decisions around a venue that naturally supports your guest experience and design goals.",
    whyVenueFirst:
      "Starting with the venue sets scale, confirms the date, and frames layout and lighting constraints. For your profile, this decision is expected to influence about 45% of total spend.",
    budgetArchitectureSummary:
      "Your budget architecture prioritizes Venue, Catering, and Photography while preserving a protected 10% buffer to control risk.",
    designDirectionSummary:
      "Soft ivory florals with structured greenery over warm stone textures, paired with layered candlelight, create a cohesive visual atmosphere.",
    planningRoadmap: [
      "Shortlist and tour 5 venue options within 3 weeks.",
      "Lock photographer within 4 weeks of venue booking.",
      "Finalize aesthetic moodboard before catering tastings.",
    ],
    confidenceClose:
      "The key to reducing stress is sequencing decisions correctly. We anchor the structure first (venue), align budget second, and let design flourish within that framework.",
    markdown:
      "## Opening Vision\nBased on your plan for Lisbon, with 120 guests and a modern romantic direction, I recommend anchoring decisions around a venue that naturally supports your guest experience and design goals.",
  },
};

function App() {
  const widgetProps = useWidgetProps<PitchWidgetPayload>(() => FALLBACK_PAYLOAD);
  const snapshot = widgetProps.snapshot ?? FALLBACK_PAYLOAD.snapshot;
  const plannerPitch = widgetProps.plannerPitch ?? FALLBACK_PAYLOAD.plannerPitch;

  const metrics: ArtifactMetric[] = [
    { label: "Location", value: snapshot.normalizedContext.location },
    { label: "Guest count", value: String(snapshot.normalizedContext.guestCount) },
    { label: "Budget tier", value: snapshot.budgetTierLabel },
  ];

  return (
    <ArtifactShell
      stepLabel="Final Output"
      title="Wedding Planner Pitch"
      summary="A cohesive proposal that converts strategy into an actionable planning narrative."
      metrics={metrics}
    >
      <ArtifactSection title="Opening vision">
        <p className="wedding-copy">{plannerPitch.openingVision}</p>
      </ArtifactSection>

      <ArtifactSection title="Why we start with the venue">
        <p className="wedding-copy">{plannerPitch.whyVenueFirst}</p>
      </ArtifactSection>

      <ArtifactSection title="Budget architecture">
        <p className="wedding-copy">{plannerPitch.budgetArchitectureSummary}</p>
      </ArtifactSection>

      <ArtifactSection title="Design direction">
        <p className="wedding-copy">{plannerPitch.designDirectionSummary}</p>
      </ArtifactSection>

      <ArtifactSection title="Planning roadmap">
        <ol className="wedding-list wedding-list-numbered">
          {plannerPitch.planningRoadmap.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </ArtifactSection>

      <ArtifactSection title="Close with confidence">
        <p className="wedding-copy">{plannerPitch.confidenceClose}</p>
      </ArtifactSection>
    </ArtifactShell>
  );
}

const root = document.getElementById("wedding-planner-pitch-root");
if (root) {
  createRoot(root).render(<App />);
}
