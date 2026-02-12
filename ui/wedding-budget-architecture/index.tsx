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

type BudgetArchitecture = {
  allocations: Array<{ category: string; percent: number; amountUsd: number }>;
  tradeoffInsights: string[];
  bufferPercent: number;
};

type DynamicTaskTimeline = {
  phases: Array<{ phase: string; window: string; tasks: string[] }>;
};

type RiskRadar = {
  topRisks: Array<{
    risk: string;
    severity: "low" | "medium" | "high";
    reason: string;
    mitigation: string;
  }>;
};

type BudgetWidgetPayload = {
  snapshot?: Snapshot;
  budgetArchitecture?: BudgetArchitecture;
  dynamicTaskTimeline?: DynamicTaskTimeline;
  riskRadar?: RiskRadar;
  nextStep?: string;
};

const FALLBACK_PAYLOAD: Required<BudgetWidgetPayload> = {
  snapshot: {
    budgetTierLabel: "Smart Luxury $40k - 120 guests",
    complexityLevel: "medium",
  },
  budgetArchitecture: {
    allocations: [
      { category: "Venue", percent: 22.5, amountUsd: 9000 },
      { category: "Catering", percent: 27.5, amountUsd: 11000 },
      { category: "Photography", percent: 10.5, amountUsd: 4200 },
      { category: "Attire", percent: 6, amountUsd: 2400 },
      { category: "Decor", percent: 11, amountUsd: 4400 },
      { category: "Entertainment", percent: 7.5, amountUsd: 3000 },
      { category: "Planner", percent: 5, amountUsd: 2000 },
      { category: "Buffer", percent: 10, amountUsd: 4000 },
    ],
    tradeoffInsights: [
      "If you increase decor by $3k, photography quality tier is likely to shift from premium to mid-tier unless overall budget expands.",
      "Elevating catering by 5% usually requires pulling from entertainment pacing or reducing premium bar duration.",
    ],
    bufferPercent: 10,
  },
  dynamicTaskTimeline: {
    phases: [
      {
        phase: "12-9 months",
        window: "Jul 2026 - Oct 2026",
        tasks: ["Venue booking", "Planner selection", "Photographer booking"],
      },
      {
        phase: "9-6 months",
        window: "Oct 2026 - Jan 2027",
        tasks: ["Catering decisions", "Design concept", "Attire planning"],
      },
      {
        phase: "6-3 months",
        window: "Jan 2027 - Apr 2027",
        tasks: ["Invitations", "Guest logistics", "Vendor timeline alignment"],
      },
      {
        phase: "3 months to wedding",
        window: "Apr 2027 - Jul 2027",
        tasks: ["Vendor confirmations", "Final fittings", "Run-of-show finalization"],
      },
    ],
  },
  riskRadar: {
    topRisks: [
      {
        risk: "Peak season availability",
        severity: "high",
        reason: "High-demand months compress venue and vendor options early.",
        mitigation: "Secure a primary and backup venue date before design commitments.",
      },
      {
        risk: "Budget creep",
        severity: "medium",
        reason: "Priority-driven upgrades can compound if contingency is not protected.",
        mitigation: "Freeze category caps after venue contract and protect the 10% buffer.",
      },
      {
        risk: "Guest logistics",
        severity: "medium",
        reason: "Travel and accommodation dependencies create timing risks for key guests.",
        mitigation: "Publish guest logistics guidance early with clear RSVP milestones.",
      },
    ],
  },
  nextStep:
    "Generate design direction to translate vibe words into palette, textures, and styling choices.",
};

function App() {
  const widgetProps = useWidgetProps<BudgetWidgetPayload>(() => FALLBACK_PAYLOAD);
  const snapshot = widgetProps.snapshot ?? FALLBACK_PAYLOAD.snapshot;
  const budget = widgetProps.budgetArchitecture ?? FALLBACK_PAYLOAD.budgetArchitecture;
  const timeline = widgetProps.dynamicTaskTimeline ?? FALLBACK_PAYLOAD.dynamicTaskTimeline;
  const riskRadar = widgetProps.riskRadar ?? FALLBACK_PAYLOAD.riskRadar;

  const metrics: ArtifactMetric[] = [
    { label: "Budget tier", value: snapshot.budgetTierLabel },
    { label: "Complexity", value: snapshot.complexityLevel },
    { label: "Buffer", value: `${budget.bufferPercent}%` },
  ];

  return (
    <ArtifactShell
      stepLabel="Step 3"
      title="Budget Architecture & Task Timeline"
      summary="Personalized budget allocations, sequencing milestones, and the top risk controls."
      metrics={metrics}
      nextStep={widgetProps.nextStep ?? FALLBACK_PAYLOAD.nextStep}
    >
      <ArtifactSection title="Allocation model">
        <div className="wedding-table">
          {budget.allocations.map((allocation) => (
            <article key={allocation.category} className="wedding-table-row">
              <p>{allocation.category}</p>
              <p>{`${allocation.percent}%`}</p>
              <p>{`$${allocation.amountUsd.toLocaleString("en-US")}`}</p>
            </article>
          ))}
        </div>
      </ArtifactSection>

      <ArtifactSection title="Tradeoff insights">
        <ul className="wedding-list">
          {budget.tradeoffInsights.map((insight) => (
            <li key={insight}>{insight}</li>
          ))}
        </ul>
      </ArtifactSection>

      <ArtifactSection title="Dynamic timeline">
        <div className="wedding-stack">
          {timeline.phases.map((phase) => (
            <article key={phase.phase} className="wedding-article">
              <header className="wedding-article-header">
                <h3>{phase.phase}</h3>
                <TextChip>{phase.window}</TextChip>
              </header>
              <ul className="wedding-list">
                {phase.tasks.map((task) => (
                  <li key={task}>{task}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </ArtifactSection>

      <ArtifactSection title="Risk radar">
        <div className="wedding-stack">
          {riskRadar.topRisks.map((risk) => (
            <article key={risk.risk} className="wedding-article">
              <header className="wedding-article-header">
                <h3>{risk.risk}</h3>
                <TextChip>{risk.severity}</TextChip>
              </header>
              <p className="wedding-copy">{risk.reason}</p>
              <p className="wedding-copy">{`Mitigation: ${risk.mitigation}`}</p>
            </article>
          ))}
        </div>
      </ArtifactSection>
    </ArtifactShell>
  );
}

const root = document.getElementById("wedding-budget-architecture-root");
if (root) {
  createRoot(root).render(<App />);
}
