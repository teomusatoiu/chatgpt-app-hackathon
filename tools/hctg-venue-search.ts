import { z } from "zod/v3";
import { defineTool } from "../utils/define-tool";

type VenueResult = {
  name: string;
  city?: string;
  region?: string;
  imageUrl?: string;
  url: string;
  listingUrl: string;
  reviewBullets?: string[];
  fetch?: { ok: boolean; status?: number; blocked?: boolean; error?: string };
};

const inputSchema = z.object({
  city: z
    .string()
    .trim()
    .optional()
    .describe("Optional city filter (e.g. 'Austin')."),
  state: z
    .string()
    .trim()
    .min(1)
    .describe("US state (e.g. 'Texas' or 'TX')."),
  maxResults: z
    .number()
    .int()
    .min(1)
    .max(12)
    .default(6)
    .describe("Max venues to return."),
  includeEditorialReview: z
    .boolean()
    .default(true)
    .describe(
      "If true, fetch each venue page and extract the site's editorial 'review' bullets (best-effort).",
    ),
});

const STATE_ABBREV_TO_SLUG: Record<string, string> = {
  AL: "alabama",
  AK: "alaska",
  AZ: "arizona",
  AR: "arkansas",
  CA: "california",
  CO: "colorado",
  CT: "connecticut",
  DE: "delaware",
  FL: "florida",
  GA: "georgia",
  HI: "hawaii",
  ID: "idaho",
  IL: "illinois",
  IN: "indiana",
  IA: "iowa",
  KS: "kansas",
  KY: "kentucky",
  LA: "louisiana",
  ME: "maine",
  MD: "maryland",
  MA: "massachusetts",
  MI: "michigan",
  MN: "minnesota",
  MS: "mississippi",
  MO: "missouri",
  MT: "montana",
  NE: "nebraska",
  NV: "nevada",
  NH: "new-hampshire",
  NJ: "new-jersey",
  NM: "new-mexico",
  NY: "new-york",
  NC: "north-carolina",
  ND: "north-dakota",
  OH: "ohio",
  OK: "oklahoma",
  OR: "oregon",
  PA: "pennsylvania",
  RI: "rhode-island",
  SC: "south-carolina",
  SD: "south-dakota",
  TN: "tennessee",
  TX: "texas",
  UT: "utah",
  VT: "vermont",
  VA: "virginia",
  WA: "washington",
  WV: "west-virginia",
  WI: "wisconsin",
  WY: "wyoming",
  DC: "district-of-columbia",
};

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function stateToSlug(state: string): string {
  const trimmed = state.trim();
  const upper = trimmed.toUpperCase();
  if (upper in STATE_ABBREV_TO_SLUG) {
    return STATE_ABBREV_TO_SLUG[upper]!;
  }
  return slugify(trimmed);
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&#(\d+);/g, (_m, n) => {
      const code = Number(n);
      return Number.isFinite(code) ? String.fromCharCode(code) : _m;
    });
}

function stripTags(html: string): string {
  return decodeHtmlEntities(html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
}

function looksBlocked(html: string): boolean {
  const lowered = html.toLowerCase();
  return (
    lowered.includes("access denied") ||
    lowered.includes("you don't have permission") ||
    lowered.includes("akamai") ||
    lowered.includes("cloudflare")
  );
}

async function fetchHtml(url: string): Promise<{
  ok: boolean;
  status: number;
  html: string;
  blocked: boolean;
}> {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      Accept: "text/html,*/*",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  const status = res.status;
  const html = await res.text();
  return { ok: res.ok, status, html, blocked: looksBlocked(html) };
}

function extractStateListingSlugs(indexHtml: string): string[] {
  const matches = indexHtml.match(/\/wedding-venues\/([a-z-]+)(?:"|')/g) ?? [];
  const slugs = matches
    .map((m) => m.replace(/^\/wedding-venues\//, "").replace(/["']$/, ""))
    .filter(Boolean);

  const uniq = Array.from(new Set(slugs));
  const excluded = new Set(["by-style", "outdoor", "elopement", "deals"]);

  return uniq
    .filter((slug) => !excluded.has(slug))
    .filter((slug) => /^[a-z-]+$/.test(slug));
}

async function resolveListingUrls(stateInput: string): Promise<string[]> {
  const baseSlug = stateToSlug(stateInput);
  const direct = `https://www.herecomestheguide.com/wedding-venues/${baseSlug}`;
  const directFetch = await fetchHtml(direct);
  if (directFetch.ok && !directFetch.blocked) {
    return [direct];
  }

  // Fallback: fetch the index and look for best matching slugs.
  const indexUrl = "https://www.herecomestheguide.com/wedding-venues";
  const indexFetch = await fetchHtml(indexUrl);
  if (!indexFetch.ok || indexFetch.blocked) {
    return [direct];
  }

  const slugs = extractStateListingSlugs(indexFetch.html);
  const needle = baseSlug;

  const matches = slugs.filter((s) => s.includes(needle));
  if (matches.length) {
    return matches.map(
      (slug) => `https://www.herecomestheguide.com/wedding-venues/${slug}`,
    );
  }

  // Last resort: return the direct URL (even if 404) so the user can click it.
  return [direct];
}

function extractVenueUrls(listingHtml: string, stateSlug: string): string[] {
  const re = new RegExp(`/wedding-venues/${stateSlug}/[a-z0-9-]+`, "g");
  const matches = listingHtml.match(re) ?? [];
  const uniq = Array.from(new Set(matches));
  // Convert to absolute.
  return uniq.map((p) => `https://www.herecomestheguide.com${p}`);
}

function extractName(html: string): string | null {
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  if (h1) return stripTags(h1);
  const og = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i)?.[1];
  if (og) return decodeHtmlEntities(og).split("|")[0]?.trim() ?? null;
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1];
  if (title) return decodeHtmlEntities(title).split("|")[0]?.trim() ?? null;
  return null;
}

function extractOgImageUrl(html: string): string | undefined {
  const og = html.match(
    /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']\s*\/?>/i,
  )?.[1];
  if (og) return decodeHtmlEntities(og).trim();
  const twitter = html.match(
    /<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']\s*\/?>/i,
  )?.[1];
  if (twitter) return decodeHtmlEntities(twitter).trim();
  return undefined;
}

function extractAddressSignals(html: string): { city?: string; region?: string } {
  const city = html.match(/"addressLocality"\s*:\s*"([^"]+)"/)?.[1];
  const region = html.match(/"addressRegion"\s*:\s*"([^"]+)"/)?.[1];
  return {
    ...(city ? { city: decodeHtmlEntities(city) } : {}),
    ...(region ? { region: decodeHtmlEntities(region) } : {}),
  };
}

function extractEditorialReviewBullets(html: string): string[] {
  const anchorIdx = html.indexOf('id="venueAbout"');
  if (anchorIdx < 0) return [];
  const window = html.slice(anchorIdx, anchorIdx + 5000);
  const ul = window.match(/<ul>([\s\S]*?)<\/ul>/i)?.[1];
  if (!ul) return [];
  const items = Array.from(ul.matchAll(/<li>([\s\S]*?)<\/li>/gi)).map((m) =>
    stripTags(m[1] ?? ""),
  );
  return items.filter(Boolean).slice(0, 8);
}

export default defineTool({
  name: "hctg-venue-search",
  title: "HereComesTheGuide: Wedding Venues + Editorial Review (Best-Effort)",
  description:
    "Searches HereComesTheGuide.com wedding venues by US state (and optional city filter). Returns venue links and editorial 'review' bullets from the venue page.",
  annotations: {
    readOnlyHint: true,
    openWorldHint: true,
    destructiveHint: false,
  },
  input: inputSchema,
  // Cache-bust: ChatGPT may keep using an older widget/template for the same URI.
  ui: "hctg-venue-search-v2",
  invoking: "Searching wedding venues",
  invoked: "Venue search complete",
  async handler(input) {
    const stateSlug = stateToSlug(input.state);
    const listingUrls = await resolveListingUrls(input.state);

    const cityNeedle = input.city?.trim().toLowerCase() ?? "";
    const results: VenueResult[] = [];

    const listingFetchFailures: Array<{ url: string; status: number; blocked: boolean }> =
      [];

    for (const listingUrl of listingUrls) {
      if (results.length >= input.maxResults) break;

      const listingFetch = await fetchHtml(listingUrl);
      if (!listingFetch.ok || listingFetch.blocked) {
        listingFetchFailures.push({
          url: listingUrl,
          status: listingFetch.status,
          blocked: listingFetch.blocked,
        });
        continue;
      }

      const listingSlug = listingUrl.split("/").slice(-1)[0] ?? stateSlug;
      const venueUrls = extractVenueUrls(listingFetch.html, listingSlug);

      for (const url of venueUrls) {
        if (results.length >= input.maxResults) break;

        if (!input.includeEditorialReview && !cityNeedle) {
          results.push({
            name: url.split("/").slice(-1)[0] ?? "Venue",
            url,
            listingUrl,
          });
          continue;
        }

        const venueFetch = await fetchHtml(url);
        const fetchMeta: VenueResult["fetch"] = {
          ok: venueFetch.ok,
          status: venueFetch.status,
          blocked: venueFetch.blocked,
        };
        if (!venueFetch.ok || venueFetch.blocked) {
          continue;
        }

        const name =
          extractName(venueFetch.html) ?? url.split("/").slice(-1)[0] ?? "Venue";
        const addr = extractAddressSignals(venueFetch.html);
      const imageUrl = extractOgImageUrl(venueFetch.html);

        if (cityNeedle) {
          const cityMatch = (addr.city ?? "").toLowerCase().includes(cityNeedle);
          const nameMatch = name.toLowerCase().includes(cityNeedle);
          if (!cityMatch && !nameMatch) {
            continue;
          }
        }

        const reviewBullets = input.includeEditorialReview
          ? extractEditorialReviewBullets(venueFetch.html)
          : [];

        results.push({
          name,
          city: addr.city,
          region: addr.region,
        imageUrl,
          url,
          listingUrl,
          reviewBullets: reviewBullets.length ? reviewBullets : undefined,
          fetch: fetchMeta,
        });
      }
    }

    const listingUrlForDisplay = listingUrls[0] ?? `https://www.herecomestheguide.com/wedding-venues/${stateSlug}`;

    const text = [
      `Listing: ${listingUrlForDisplay}`,
      listingUrls.length > 1 ? `Also searched: ${listingUrls.slice(1).join(", ")}` : "",
      input.city ? `City filter: ${input.city}` : "",
      "",
      results.length ? "Venues:" : "No venues matched. Try removing city filter.",
      ...results.map((v, idx) => {
        const loc = [v.city, v.region].filter(Boolean).join(", ");
        const head = `${idx + 1}) ${v.name}${loc ? ` — ${loc}` : ""}`;
        const bullets = (v.reviewBullets ?? []).slice(0, 4).map((b) => `   • ${b}`);
        return [head, `   ${v.url}`, ...bullets].join("\n");
      }),
    ]
      .filter(Boolean)
      .join("\n");

    return {
      content: [{ type: "text", text }],
      structuredContent: {
        state: input.state,
        stateSlug,
        city: input.city ?? null,
        listingUrl: listingUrlForDisplay,
        listingUrls,
        venues: results,
        listingFetchFailures,
        notes: [
          "These are editorial 'review' bullets from HereComesTheGuide, not user-generated reviews.",
          "If you need user reviews, we can link out to Google/Yelp pages (API-backed) or summarize pasted excerpts.",
        ],
      },
    };
  },
});

