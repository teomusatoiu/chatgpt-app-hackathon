import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

import { Button } from "@openai/apps-sdk-ui/components/Button";
import { Image } from "@openai/apps-sdk-ui/components/Image";

import { useMaxHeight } from "../hooks/use-max-height";
import { useWidgetProps } from "../hooks/use-widget-props";

type ToolInputs = {
  intakeSessionId?: string;
  country: string;
  budgetUsd: number;
  guestCount: number;
  theme: string;
  colorPalette: string;
  venueCount?: number;
  slideCount?: number;
};

type Venue = {
  name: string;
  location: string;
  whyFits: string[];
  tripadvisorSearchUrl: string;
};

type BudgetLine = {
  category: string;
  percent: number;
  amountUsd: number;
  notes?: string;
};

type Slide = {
  title: string;
  bullets: string[];
  imageUrl?: string | null;
};

type ToolOutput = {
  inputs: ToolInputs;
  plan: {
    coupleTagline: string;
    conceptSummary: string;
    venues: Venue[];
    budget: { totalUsd: number; lines: BudgetLine[] };
    slides: Slide[];
  };
  exports: {
    pdfUrl: string;
    pdfName: string;
    budgetCsvUrl: string;
    budgetCsvName: string;
  };
};

function toAbsUrl(maybeRelative: string): string {
  try {
    return new URL(maybeRelative, window.location.origin).toString();
  } catch {
    return maybeRelative;
  }
}

function numberOr<T extends number>(value: unknown, fallback: T): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function App() {
  const maxHeight = useMaxHeight() ?? undefined;
  const toolOutput = useWidgetProps<ToolOutput>(() => ({
    inputs: {
      intakeSessionId: undefined,
      country: "Italy",
      budgetUsd: 60000,
      guestCount: 90,
      theme: "romantic coastal villa",
      colorPalette: "ivory + sage + gold",
      venueCount: 5,
      slideCount: 10,
    },
    plan: {
      coupleTagline: "Dream wedding concept",
      conceptSummary:
        "Run the tool to generate a full pitch deck, venues, and budget.",
      venues: [],
      budget: { totalUsd: 60000, lines: [] },
      slides: [],
    },
    exports: {
      pdfUrl: "",
      pdfName: "",
      budgetCsvUrl: "",
      budgetCsvName: "",
    },
  }));

  const initialInputs = toolOutput?.inputs;
  const [draft, setDraft] = useState<ToolInputs>(initialInputs);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenError, setRegenError] = useState<string | null>(null);

  const exports = toolOutput?.exports;
  const plan = toolOutput?.plan;

  const canExport = Boolean(exports?.pdfUrl && exports?.budgetCsvUrl);
  const isEmptyPlan = (plan?.slides?.length ?? 0) === 0 && (plan?.venues?.length ?? 0) === 0;

  const askIntakeQuestions = useCallback(async () => {
    try {
      await window.openai.sendFollowUpMessage({
        prompt: [
          "Act as a wedding planner intake assistant.",
          "Ask me these questions ONE AT A TIME (wait for my answer each time):",
          "1) Which country is the wedding in? (and city/region if known)",
          "2) Total budget in USD?",
          "3) Guest count estimate?",
          "4) Theme/vibe (3-6 words)?",
          "5) Color palette (2-4 colors)?",
          "",
          "After collecting answers, summarize them back and call the MCP tool `wedding-pitch-deck` with:",
          "Include the `intakeSessionId` from the current widget state.",
          `{ intakeSessionId, country, budgetUsd, guestCount, theme, colorPalette, venueCount: 5, slideCount: 10 }`,
        ].join("\n"),
      });
    } catch {
      // If host doesn't support follow-ups for some reason, user can still use the form.
    }
  }, []);

  // Auto-start intake in chat on first open when there's no generated plan.
  const hasAutoAskedRef = useRef(false);
  useEffect(() => {
    if (!isEmptyPlan) return;
    if (hasAutoAskedRef.current) return;
    hasAutoAskedRef.current = true;
    void askIntakeQuestions();
  }, [askIntakeQuestions, isEmptyPlan]);

  const onRegenerate = useCallback(async () => {
    setIsRegenerating(true);
    setRegenError(null);
    try {
      if (!draft.intakeSessionId) {
        setRegenError(
          "Start with `wedding-planner` (intake) first, then regenerate from the widget.",
        );
        return;
      }
      const args: ToolInputs = {
        intakeSessionId: draft.intakeSessionId,
        country: draft.country,
        budgetUsd: numberOr(draft.budgetUsd, 60000),
        guestCount: Math.max(1, Math.floor(numberOr(draft.guestCount, 90))),
        theme: draft.theme,
        colorPalette: draft.colorPalette,
        venueCount: Math.max(3, Math.floor(numberOr(draft.venueCount, 5))),
        slideCount: Math.max(6, Math.floor(numberOr(draft.slideCount, 10))),
      };

      // Host will run the tool and (typically) refresh toolOutput for this widget.
      await window.openai.callTool("wedding-pitch-deck", args);
    } catch (error) {
      setRegenError(
        error instanceof Error ? error.message : "Failed to regenerate",
      );
    } finally {
      setIsRegenerating(false);
    }
  }, [draft]);

  const onOpenPdf = useCallback(() => {
    if (!exports?.pdfUrl) return;
    window.openai.openExternal({ href: toAbsUrl(exports.pdfUrl) });
  }, [exports?.pdfUrl]);

  const onOpenCsv = useCallback(() => {
    if (!exports?.budgetCsvUrl) return;
    window.openai.openExternal({ href: toAbsUrl(exports.budgetCsvUrl) });
  }, [exports?.budgetCsvUrl]);

  const budgetTotal = plan?.budget?.totalUsd ?? toolOutput?.inputs?.budgetUsd;

  const sortedBudget = useMemo(() => {
    const lines = plan?.budget?.lines ?? [];
    return [...lines].sort((a, b) => b.amountUsd - a.amountUsd);
  }, [plan?.budget?.lines]);

  return (
    <div
      className="w-full overflow-hidden bg-white"
      style={{
        maxHeight,
        overflowY: "auto",
      }}
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-5">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold text-slate-900">
              Wedding Pitch Deck
            </h1>
            <p className="text-sm text-slate-600">
              {plan?.coupleTagline ?? "Generated concept"} •{" "}
              <span className="font-medium">{toolOutput.inputs.country}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              color="primary"
              variant="solid"
              size="sm"
              onClick={onOpenPdf}
              disabled={!exports?.pdfUrl}
            >
              Open PDF
            </Button>
            <Button
              type="button"
              color="secondary"
              variant="outline"
              size="sm"
              onClick={onOpenCsv}
              disabled={!exports?.budgetCsvUrl}
            >
              Download Budget CSV
            </Button>
          </div>
        </header>

        <section className="mt-5 grid gap-4 rounded-3xl border border-black/10 bg-white p-4 sm:grid-cols-2">
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Inputs (edit + regenerate)
            </h2>

            {isEmptyPlan ? (
              <div className="rounded-2xl border border-black/10 bg-slate-50 p-3 text-xs text-slate-700">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="font-semibold">Start here</div>
                    <div className="text-slate-600">
                      Want ChatGPT to ask the intake questions first?
                    </div>
                  </div>
                  <Button
                    type="button"
                    color="secondary"
                    variant="outline"
                    size="sm"
                    onClick={askIntakeQuestions}
                  >
                    Ask intake questions
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-3">
              <label className="space-y-1">
                <div className="text-xs font-medium text-slate-700">Country</div>
                <input
                  className="w-full rounded-xl border border-black/15 px-3 py-2 text-sm outline-none focus:border-black/35"
                  value={draft.country}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, country: e.target.value }))
                  }
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1">
                  <div className="text-xs font-medium text-slate-700">
                    Budget (USD)
                  </div>
                  <input
                    inputMode="numeric"
                    className="w-full rounded-xl border border-black/15 px-3 py-2 text-sm outline-none focus:border-black/35"
                    value={String(draft.budgetUsd)}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        budgetUsd: numberOr(e.target.value, p.budgetUsd),
                      }))
                    }
                  />
                </label>

                <label className="space-y-1">
                  <div className="text-xs font-medium text-slate-700">
                    Guests
                  </div>
                  <input
                    inputMode="numeric"
                    className="w-full rounded-xl border border-black/15 px-3 py-2 text-sm outline-none focus:border-black/35"
                    value={String(draft.guestCount)}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        guestCount: numberOr(e.target.value, p.guestCount),
                      }))
                    }
                  />
                </label>
              </div>

              <label className="space-y-1">
                <div className="text-xs font-medium text-slate-700">Theme</div>
                <input
                  className="w-full rounded-xl border border-black/15 px-3 py-2 text-sm outline-none focus:border-black/35"
                  value={draft.theme}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, theme: e.target.value }))
                  }
                />
              </label>

              <label className="space-y-1">
                <div className="text-xs font-medium text-slate-700">
                  Color palette
                </div>
                <input
                  className="w-full rounded-xl border border-black/15 px-3 py-2 text-sm outline-none focus:border-black/35"
                  value={draft.colorPalette}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, colorPalette: e.target.value }))
                  }
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1">
                  <div className="text-xs font-medium text-slate-700">
                    Venues
                  </div>
                  <input
                    inputMode="numeric"
                    className="w-full rounded-xl border border-black/15 px-3 py-2 text-sm outline-none focus:border-black/35"
                    value={String(draft.venueCount ?? 5)}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        venueCount: numberOr(e.target.value, p.venueCount ?? 5),
                      }))
                    }
                  />
                </label>

                <label className="space-y-1">
                  <div className="text-xs font-medium text-slate-700">
                    Slides
                  </div>
                  <input
                    inputMode="numeric"
                    className="w-full rounded-xl border border-black/15 px-3 py-2 text-sm outline-none focus:border-black/35"
                    value={String(draft.slideCount ?? 10)}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        slideCount: numberOr(e.target.value, p.slideCount ?? 10),
                      }))
                    }
                  />
                </label>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  color="primary"
                  variant="solid"
                  size="sm"
                  onClick={onRegenerate}
                  disabled={isRegenerating}
                >
                  {isRegenerating ? "Regenerating..." : "Regenerate"}
                </Button>
                {regenError ? (
                  <span className="text-xs text-red-600">{regenError}</span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Concept summary
            </h2>
            <p className="text-sm leading-relaxed text-slate-700">
              {plan?.conceptSummary ??
                "Run the tool to generate a full concept summary."}
            </p>
            <div className="rounded-2xl border border-black/10 bg-slate-50 p-3 text-xs text-slate-600">
              {canExport ? (
                <>
                  Exports ready: <span className="font-medium">{exports?.pdfName}</span>{" "}
                  and <span className="font-medium">{exports?.budgetCsvName}</span>.
                </>
              ) : (
                "Exports will appear here after generation."
              )}
            </div>
          </div>
        </section>

        <section className="mt-6 space-y-3">
          <h2 className="text-base font-semibold text-slate-900">Slides</h2>
          {plan?.slides?.length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {plan.slides.map((s, idx) => (
                <article
                  key={`${s.title}-${idx}`}
                  className="overflow-hidden rounded-3xl border border-black/10 bg-white"
                >
                  <div className="relative h-40 w-full bg-slate-100">
                    {s.imageUrl ? (
                      <Image
                        src={s.imageUrl}
                        alt={s.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
                        No image
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/[0.06]" />
                  </div>
                  <div className="space-y-2 p-4">
                    <h3 className="text-sm font-semibold text-slate-900">
                      {idx + 1}. {s.title}
                    </h3>
                    <div className="space-y-1 text-xs text-slate-700">
                      {(s.bullets ?? []).slice(0, 5).map((b, i) => (
                        <p key={`${idx}-b-${i}`} className="line-clamp-2">
                          • {b}
                        </p>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-600">
              No slides yet — click Regenerate to create the deck.
            </p>
          )}
        </section>

        <section className="mt-6 space-y-3">
          <h2 className="text-base font-semibold text-slate-900">
            Venue shortlist (with TripAdvisor review links)
          </h2>
          {plan?.venues?.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {plan.venues.map((v, idx) => (
                <article
                  key={`${v.name}-${idx}`}
                  className="rounded-3xl border border-black/10 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-slate-900">
                        {v.name}
                      </h3>
                      <p className="text-xs text-slate-600">{v.location}</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      color="secondary"
                      size="xs"
                      onClick={() =>
                        window.openai.openExternal({
                          href: toAbsUrl(v.tripadvisorSearchUrl),
                        })
                      }
                    >
                      TripAdvisor reviews
                    </Button>
                  </div>
                  <div className="mt-3 space-y-1 text-xs text-slate-700">
                    {(v.whyFits ?? []).slice(0, 4).map((w, i) => (
                      <p key={`${idx}-w-${i}`}>• {w}</p>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-600">
              No venues yet — click Regenerate to create a shortlist.
            </p>
          )}
        </section>

        <section className="mt-6 space-y-3">
          <h2 className="text-base font-semibold text-slate-900">Budget</h2>
          {sortedBudget.length ? (
            <div className="overflow-hidden rounded-3xl border border-black/10">
              <table className="w-full border-collapse bg-white text-left text-sm">
                <thead className="bg-slate-50 text-xs text-slate-700">
                  <tr>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Percent</th>
                    <th className="px-4 py-3">Amount (USD)</th>
                    <th className="px-4 py-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {sortedBudget.map((l, idx) => (
                    <tr key={`${l.category}-${idx}`} className="text-xs">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {l.category}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {l.percent}%
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        ${l.amountUsd.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {l.notes ?? ""}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 text-xs">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      Total
                    </td>
                    <td className="px-4 py-3 text-slate-700">100%</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      ${Number(budgetTotal ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-600">
              No budget yet — click Regenerate to build a budget.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

const rootEl = document.getElementById("wedding-pitch-deck-root");
if (rootEl) {
  createRoot(rootEl).render(<App />);
}

