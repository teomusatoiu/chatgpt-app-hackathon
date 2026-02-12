import { createRoot } from "react-dom/client";
import { useMemo } from "react";

import { Button } from "@openai/apps-sdk-ui/components/Button";
import { useWidgetProps } from "../hooks/use-widget-props";

type Venue = {
  name: string;
  city?: string;
  region?: string;
  imageUrl?: string;
  url: string;
  listingUrl: string;
  reviewBullets?: string[];
  fetch?: { ok: boolean; status?: number; blocked?: boolean; error?: string };
};

type ToolOutput = {
  listingUrl?: string;
  listingUrls?: string[];
  state?: string;
  city?: string | null;
  venues?: Venue[];
  notes?: string[];
  listingFetchFailures?: Array<{ url: string; status?: number; blocked?: boolean }>;
  error?: string;
};

function App() {
  const output = useWidgetProps<ToolOutput>(() => ({}));
  const venues = Array.isArray(output.venues) ? output.venues : [];
  const notes = Array.isArray(output.notes) ? output.notes : [];
  const listingUrls = Array.isArray(output.listingUrls) ? output.listingUrls : [];
  const listingFailures = Array.isArray(output.listingFetchFailures)
    ? output.listingFetchFailures
    : [];

  const title = useMemo(() => {
    const parts = [output.state, output.city].filter(Boolean);
    return parts.length ? parts.join(" • ") : "Wedding venues";
  }, [output.city, output.state]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-5">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
          <p className="text-xs text-slate-600">
            Source: Here Comes The Guide (editorial)
          </p>
        </div>

        {output.listingUrl ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            color="secondary"
            onClick={() => window.openai.openExternal({ href: output.listingUrl! })}
          >
            Open listing
          </Button>
        ) : null}
      </header>

      {output.error ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-900">
          Error: {output.error}
        </div>
      ) : null}

      {listingUrls.length > 1 ? (
        <div className="mt-4 rounded-2xl border border-black/10 bg-slate-50 p-3 text-xs text-slate-700">
          Multiple listings searched:{" "}
          {listingUrls.map((u, idx) => (
            <span key={`${u}-${idx}`}>
              <button
                type="button"
                className="underline"
                onClick={() => window.openai.openExternal({ href: u })}
              >
                {idx === 0 ? "primary" : `alt ${idx}`}
              </button>
              {idx < listingUrls.length - 1 ? " • " : ""}
            </span>
          ))}
        </div>
      ) : null}

      {listingFailures.length ? (
        <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          Some listing pages failed to fetch:{" "}
          {listingFailures
            .slice(0, 3)
            .map((f) => `${f.status ?? "?"} ${f.blocked ? "(blocked)" : ""}`)
            .join(" • ")}
        </div>
      ) : null}

      <section className="mt-5 space-y-3">
        {venues.length ? (
          venues.map((v, idx) => (
            <article
              key={`${v.url}-${idx}`}
              className="group relative cursor-pointer overflow-hidden rounded-3xl border border-black/10 bg-white"
              role="button"
              tabIndex={0}
              onClick={() => window.openai.openExternal({ href: v.url })}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  window.openai.openExternal({ href: v.url });
                }
              }}
            >
              <div className="relative aspect-[16/9] w-full bg-slate-100">
                {v.imageUrl ? (
                  <img
                    src={v.imageUrl}
                    alt={v.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-slate-600">
                    No image
                  </div>
                )}

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/0 opacity-90" />

                <div className="absolute right-3 top-3">
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    color="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.openai.openExternal({ href: v.url });
                    }}
                  >
                    Open
                  </Button>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <div className="text-xs text-white/80">
                    {idx + 1} • {[v.city, v.region].filter(Boolean).join(", ")}
                  </div>
                  <h2 className="mt-1 line-clamp-2 text-base font-semibold">
                    {v.name}
                  </h2>

                  {Array.isArray(v.reviewBullets) && v.reviewBullets.length ? (
                    <div className="mt-2 space-y-1 text-xs text-white/90">
                      {v.reviewBullets.slice(0, 3).map((b, i) => (
                        <p key={`${v.url}-b-${i}`} className="line-clamp-2">
                          • {b}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-black/20 bg-white p-6 text-sm text-slate-600">
            No venues returned. Try a different state slug, or remove the city
            filter.
          </div>
        )}
      </section>

      {notes.length ? (
        <footer className="mt-6 rounded-2xl border border-black/10 bg-slate-50 p-3 text-xs text-slate-700">
          {notes.join(" ")}
        </footer>
      ) : null}
    </div>
  );
}

const root = document.getElementById("hctg-venue-search-v2-root");
if (root) {
  createRoot(root).render(<App />);
}

