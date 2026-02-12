import clsx from "clsx";
import type { ReactNode } from "react";

export type ArtifactMetric = {
  label: string;
  value: string;
};

type ArtifactShellProps = {
  stepLabel: string;
  title: string;
  summary: string;
  metrics?: ArtifactMetric[];
  nextStep?: string;
  children: ReactNode;
};

export function ArtifactShell({
  stepLabel,
  title,
  summary,
  metrics = [],
  nextStep,
  children,
}: ArtifactShellProps) {
  return (
    <main className="wedding-shell">
      <section className="wedding-card wedding-card-primary">
        <p className="wedding-step">{stepLabel}</p>
        <h1 className="wedding-title">{title}</h1>
        <p className="wedding-summary">{summary}</p>
        {metrics.length > 0 && (
          <div className="wedding-metrics">
            {metrics.map((metric) => (
              <article key={metric.label} className="wedding-metric">
                <p className="wedding-metric-label">{metric.label}</p>
                <p className="wedding-metric-value">{metric.value}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="wedding-card wedding-stack">{children}</section>

      {nextStep && (
        <section className="wedding-card wedding-next-step">
          <p className="wedding-next-step-label">Next step</p>
          <p className="wedding-next-step-body">{nextStep}</p>
        </section>
      )}
    </main>
  );
}

type SectionProps = {
  title: string;
  children: ReactNode;
  className?: string;
};

export function ArtifactSection({ title, children, className }: SectionProps) {
  return (
    <section className={clsx("wedding-section", className)}>
      <h2 className="wedding-section-title">{title}</h2>
      <div className="wedding-section-content">{children}</div>
    </section>
  );
}

type ChipProps = {
  children: ReactNode;
};

export function TextChip({ children }: ChipProps) {
  return <span className="wedding-chip">{children}</span>;
}
