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
  recommendedStartingPillar: "venue-first" | "theme-first";
  normalizedContext: { vibeWords: string[] };
};

type DesignDirection = {
  colorPalette: string[];
  textures: string[];
  lightingStyle: string;
  floralDirection: string;
  dressCodeSuggestion: string;
  narrativeLine: string;
};

type DesignWidgetPayload = {
  snapshot?: Snapshot;
  designDirection?: DesignDirection;
  nextStep?: string;
};

const FALLBACK_PAYLOAD: Required<DesignWidgetPayload> = {
  snapshot: {
    budgetTierLabel: "Smart Luxury $40k - 120 guests",
    recommendedStartingPillar: "venue-first",
    normalizedContext: {
      vibeWords: ["modern", "romantic", "minimalist"],
    },
  },
  designDirection: {
    colorPalette: ["warm white", "champagne gold", "dusty rose", "graphite"],
    textures: ["smooth linen", "polished stone", "silk ribbon"],
    lightingStyle: "architectural pin-spot lighting with soft perimeter wash",
    floralDirection: "Soft ivory florals with structured greenery and sculptural accents",
    dressCodeSuggestion: "Modern cocktail attire",
    narrativeLine:
      "Soft ivory florals with structured greenery against warm stone textures create an elegant look that feels intentional in every photo frame.",
  },
  nextStep:
    "Create the final planner pitch to combine strategy, budget architecture, and design direction into one proposal.",
};

function App() {
  const widgetProps = useWidgetProps<DesignWidgetPayload>(() => FALLBACK_PAYLOAD);
  const snapshot = widgetProps.snapshot ?? FALLBACK_PAYLOAD.snapshot;
  const designDirection = widgetProps.designDirection ?? FALLBACK_PAYLOAD.designDirection;

  const metrics: ArtifactMetric[] = [
    { label: "Budget tier", value: snapshot.budgetTierLabel },
    { label: "Starting pillar", value: snapshot.recommendedStartingPillar },
    { label: "Vibe words", value: snapshot.normalizedContext.vibeWords.join(", ") },
  ];

  return (
    <ArtifactShell
      stepLabel="Step 4"
      title="Theme & Aesthetic Direction"
      summary="A concrete design language tied to your budget, priorities, and venue strategy."
      metrics={metrics}
      nextStep={widgetProps.nextStep ?? FALLBACK_PAYLOAD.nextStep}
    >
      <ArtifactSection title="Color palette">
        <div className="wedding-chip-row">
          {designDirection.colorPalette.map((color) => (
            <TextChip key={color}>{color}</TextChip>
          ))}
        </div>
      </ArtifactSection>

      <ArtifactSection title="Texture guidance">
        <div className="wedding-chip-row">
          {designDirection.textures.map((texture) => (
            <TextChip key={texture}>{texture}</TextChip>
          ))}
        </div>
      </ArtifactSection>

      <ArtifactSection title="Styling direction">
        <p className="wedding-copy">{`Lighting: ${designDirection.lightingStyle}`}</p>
        <p className="wedding-copy">{`Florals: ${designDirection.floralDirection}`}</p>
        <p className="wedding-copy">{`Dress code: ${designDirection.dressCodeSuggestion}`}</p>
      </ArtifactSection>

      <ArtifactSection title="Narrative line">
        <p className="wedding-copy">{designDirection.narrativeLine}</p>
      </ArtifactSection>
    </ArtifactShell>
  );
}

const root = document.getElementById("wedding-design-direction-root");
if (root) {
  createRoot(root).render(<App />);
}
