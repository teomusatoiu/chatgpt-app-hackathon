import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { z } from "zod/v3";
import { defineTool } from "../utils/define-tool";
import { assertValidWeddingIntakeSessionId } from "./wedding-intake-store";

const weddingPitchDeckInput = z.object({
  intakeSessionId: z
    .string()
    .min(8)
    .describe(
      "Intake session id issued by `wedding-planner`. Required to prevent accidental generation before intake.",
    ),
  country: z.string().min(2).describe("Country where the wedding will take place."),
  budgetUsd: z
    .number()
    .positive()
    .describe("Total budget in USD (MVP assumes USD)."),
  guestCount: z
    .number()
    .int()
    .positive()
    .describe("Approximate guest list size."),
  theme: z.string().min(2).describe("General theme/vibe (e.g. 'coastal chic')."),
  colorPalette: z
    .string()
    .min(2)
    .describe("Primary colors (e.g. 'sage + ivory + gold')."),
  venueCount: z
    .number()
    .int()
    .min(3)
    .max(8)
    .default(5)
    .describe("How many wedding venues to propose."),
  slideCount: z
    .number()
    .int()
    .min(6)
    .max(14)
    .default(10)
    .describe("How many slides to generate."),
});

type Venue = {
  name: string;
  location: string;
  whyFits: string[];
  tripadvisorSearchUrl: string;
};

type BudgetLine = {
  category: string;
  percent: number; // 0-100
  amountUsd: number;
  notes?: string;
};

type Slide = {
  title: string;
  bullets: string[];
  imagePrompt?: string | null;
  imageUrl?: string | null;
};

type WeddingPitchPlan = {
  coupleTagline: string;
  conceptSummary: string;
  venues: Venue[];
  budget: {
    totalUsd: number;
    lines: BudgetLine[];
  };
  slides: Slide[];
};

function mustGetEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function safeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function sha256Base64Url(input: string): string {
  return crypto.createHash("sha256").update(input).digest("base64url");
}

async function openaiChatJson<T>({
  apiKey,
  model,
  prompt,
}: {
  apiKey: string;
  model: string;
  prompt: string;
}): Promise<T> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.6,
      messages: [
        {
          role: "system",
          content:
            "You are a wedding planner copilot. Output must be STRICT JSON only (no markdown, no commentary).",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `OpenAI chat.completions failed (${res.status}): ${text || res.statusText}`,
    );
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content ?? "";
  if (!content) {
    throw new Error("OpenAI returned empty completion.");
  }

  try {
    return JSON.parse(content) as T;
  } catch (error) {
    throw new Error(
      `Failed to parse JSON from model output. First 500 chars:\n${content.slice(
        0,
        500,
      )}`,
    );
  }
}

function detectImageExtension(bytes: Uint8Array): "png" | "jpg" {
  // PNG magic: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "png";
  }
  // JPEG magic: FF D8
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    return "jpg";
  }
  // Default to png; many OpenAI image responses are PNG.
  return "png";
}

async function openaiGenerateImage({
  apiKey,
  prompt,
  size = "1024x1024",
}: {
  apiKey: string;
  prompt: string;
  size?: string;
}): Promise<{ bytes: Uint8Array; ext: "png" | "jpg" }> {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt,
      size,
      // Note: some image models reject `response_format`. We accept whatever the
      // API returns (b64 or URL) and normalize it below.
      output_format: "png",
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `OpenAI images generation failed (${res.status}): ${text || res.statusText}`,
    );
  }

  const data = (await res.json()) as {
    data?: Array<{ b64_json?: string; url?: string }>;
  };
  const first = data.data?.[0];
  const b64 = first?.b64_json;
  const url = first?.url;

  if (b64) {
    const bytes = Buffer.from(b64, "base64");
    const ext = detectImageExtension(bytes);
    return { bytes, ext };
  }

  if (url) {
    const imgRes = await fetch(url);
    if (!imgRes.ok) {
      throw new Error(
        `OpenAI image returned URL but fetch failed (${imgRes.status})`,
      );
    }
    const arrayBuf = await imgRes.arrayBuffer();
    const bytes = new Uint8Array(arrayBuf);
    const ext = detectImageExtension(bytes);
    return { bytes, ext };
  }

  throw new Error("OpenAI image response missing b64_json/url.");
}

function toTripAdvisorSearchUrl(query: string): string {
  // Note: we link out to TripAdvisor search results (safer than scraping/copying reviews).
  return `https://www.tripadvisor.com/Search?q=${encodeURIComponent(query)}`;
}

function createBudgetCsv(lines: BudgetLine[], totalUsd: number): string {
  const header = ["Category", "Percent", "AmountUSD", "Notes"];
  const rows = lines.map((l) => [
    l.category,
    String(l.percent),
    l.amountUsd.toFixed(2),
    l.notes ?? "",
  ]);
  const all = [header, ...rows, ["TOTAL", "100", totalUsd.toFixed(2), ""]];
  return all
    .map((row) =>
      row
        .map((cell) => {
          const needsQuotes = /[",\n]/.test(cell);
          const escaped = cell.replace(/"/g, '""');
          return needsQuotes ? `"${escaped}"` : escaped;
        })
        .join(","),
    )
    .join("\n");
}

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const next = current ? `${current} ${w}` : w;
    if (next.length > maxCharsPerLine) {
      if (current) {
        lines.push(current);
        current = w;
      } else {
        lines.push(next.slice(0, maxCharsPerLine));
        current = next.slice(maxCharsPerLine);
      }
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

async function buildDeckPdf({
  slides,
  assetBaseDir,
  pdfPath,
}: {
  slides: Array<Pick<Slide, "title" | "bullets" | "imageUrl">>;
  assetBaseDir: string;
  pdfPath: string;
}) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  // 16:9 "slides" in points.
  const pageW = 960;
  const pageH = 540;

  for (const slide of slides) {
    const page = doc.addPage([pageW, pageH]);

    // Background image if present.
    if (slide.imageUrl) {
      const relative = slide.imageUrl.replace(/^\/assets\//, "");
      const localPath = path.resolve(assetBaseDir, relative);
      if (fs.existsSync(localPath)) {
        const bytes = await fs.promises.readFile(localPath);
        let img:
          | Awaited<ReturnType<PDFDocument["embedPng"]>>
          | Awaited<ReturnType<PDFDocument["embedJpg"]>>
          | null = null;
        try {
          img = await doc.embedPng(bytes);
        } catch {
          img = await doc.embedJpg(bytes);
        }

        const { width: iw, height: ih } = img.scale(1);
        // Scale to cover page, center-crop.
        const scale = Math.max(pageW / iw, pageH / ih);
        const drawW = iw * scale;
        const drawH = ih * scale;
        const x = (pageW - drawW) / 2;
        const y = (pageH - drawH) / 2;
        page.drawImage(img, { x, y, width: drawW, height: drawH });
      }
    } else {
      page.drawRectangle({
        x: 0,
        y: 0,
        width: pageW,
        height: pageH,
        color: rgb(0.98, 0.98, 0.99),
      });
    }

    // Text panel overlay for readability.
    const panelX = 48;
    const panelY = 48;
    const panelW = pageW - 96;
    const panelH = 210;
    page.drawRectangle({
      x: panelX,
      y: panelY,
      width: panelW,
      height: panelH,
      color: rgb(1, 1, 1),
      opacity: 0.82,
    });

    // Title
    const titleSize = 28;
    page.drawText(slide.title, {
      x: panelX + 18,
      y: panelY + panelH - 48,
      size: titleSize,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });

    // Bullets
    const bulletSize = 16;
    const bulletStartY = panelY + panelH - 78;
    const maxBulletLines = 7;
    const bulletLines: string[] = [];

    for (const b of slide.bullets.slice(0, 6)) {
      const wrapped = wrapText(b, 56);
      const prefixed = wrapped.map((line, idx) =>
        idx === 0 ? `• ${line}` : `  ${line}`,
      );
      bulletLines.push(...prefixed);
      if (bulletLines.length >= maxBulletLines) break;
    }

    let y = bulletStartY;
    for (const line of bulletLines.slice(0, maxBulletLines)) {
      page.drawText(line, {
        x: panelX + 22,
        y,
        size: bulletSize,
        font,
        color: rgb(0.15, 0.15, 0.15),
      });
      y -= 22;
    }
  }

  const pdfBytes = await doc.save();
  await fs.promises.writeFile(pdfPath, pdfBytes);
}

export default defineTool({
  name: "wedding-pitch-deck",
  title: "Wedding Planner: Generate Pitch Deck (PDF + AI Images + CSV)",
  description:
    "Generate the wedding concept pitch: AI visuals in a slide-deck PDF, a venue shortlist with TripAdvisor review links, and a budget CSV. For a guided intake flow, run `wedding-planner` first.",
  annotations: {
    readOnlyHint: true,
    openWorldHint: true, // calls OpenAI APIs
    destructiveHint: false,
  },
  input: weddingPitchDeckInput,
  ui: "wedding-pitch-deck",
  invoking: "Planning the wedding pitch deck",
  invoked: "Wedding pitch deck ready",
  async handler(input) {
    assertValidWeddingIntakeSessionId(input.intakeSessionId);
    const apiKey = mustGetEnv("OPENAI_API_KEY");
    const model = process.env.OPENAI_TEXT_MODEL ?? "gpt-4o-mini";

    const planPrompt = [
      "Create a wedding pitch plan as strict JSON matching this TypeScript shape:",
      "",
      `type WeddingPitchPlan = {`,
      `  coupleTagline: string;`,
      `  conceptSummary: string;`,
      `  venues: Array<{ name: string; location: string; whyFits: string[] }>;`,
      `  budget: { totalUsd: number; lines: Array<{ category: string; percent: number; amountUsd: number; notes?: string }> };`,
      `  slides: Array<{ title: string; bullets: string[]; imagePrompt?: string | null }>;`,
      `};`,
      "",
      "Rules:",
      "- slides length must equal slideCount.",
      "- venues length must equal venueCount.",
      "- budget.totalUsd must equal the provided budgetUsd input.",
      "- budget.lines percent values must sum to 100 exactly.",
      "- amountUsd should match budgetUsd * percent/100 (rounded to nearest dollar).",
      "- Include 5-7 bullet points max per slide, concise, pitch-ready.",
      "- imagePrompt should be present for most slides; prefer photo-real / editorial wedding imagery; no text in the image; no logos; no watermarks.",
      "",
      `Inputs: ${JSON.stringify(input)}`,
    ].join("\n");

    const rawPlan = await openaiChatJson<WeddingPitchPlan>({
      apiKey,
      model,
      prompt: planPrompt,
    });

    const normalizePlan = (plan: WeddingPitchPlan): WeddingPitchPlan => {
      const venues = Array.isArray(plan.venues) ? plan.venues : [];
      const slides = Array.isArray(plan.slides) ? plan.slides : [];
      const lines = Array.isArray(plan.budget?.lines) ? plan.budget.lines : [];

      // Clamp venue/slide counts.
      const desiredVenues = input.venueCount;
      const desiredSlides = input.slideCount;

      const normalizedVenues = venues.slice(0, desiredVenues);
      while (normalizedVenues.length < desiredVenues) {
        normalizedVenues.push({
          name: `Venue option ${normalizedVenues.length + 1}`,
          location: input.country,
          whyFits: ["Beautiful setting", "Guest-friendly logistics", "Strong photo opportunities"],
        });
      }

      const normalizedSlides = slides.slice(0, desiredSlides);
      while (normalizedSlides.length < desiredSlides) {
        normalizedSlides.push({
          title: `Slide ${normalizedSlides.length + 1}`,
          bullets: [
            "Key details",
            "Design direction",
            "Guest experience highlights",
            "Next-step decisions",
          ],
          imagePrompt: `Wedding editorial photo that fits the theme (${input.theme}) and color palette (${input.colorPalette}).`,
        });
      }

      // Normalize budget percents to sum to 100 and recompute amounts from input budget.
      const sanitizedLines = lines
        .map((l) => ({
          category: String((l as BudgetLine).category ?? "Other"),
          percent: Math.max(0, Math.round(Number((l as BudgetLine).percent) || 0)),
          amountUsd: 0,
          notes:
            typeof (l as BudgetLine).notes === "string" ? (l as BudgetLine).notes : undefined,
        }))
        .filter((l) => l.category.trim().length > 0);

      if (sanitizedLines.length === 0) {
        sanitizedLines.push(
          { category: "Venue", percent: 35, amountUsd: 0 },
          { category: "Catering + Bar", percent: 35, amountUsd: 0 },
          { category: "Photo + Video", percent: 10, amountUsd: 0 },
          { category: "Florals + Decor", percent: 10, amountUsd: 0 },
          { category: "Music + Entertainment", percent: 5, amountUsd: 0 },
          { category: "Contingency", percent: 5, amountUsd: 0 },
        );
      }

      const sum = sanitizedLines.reduce((t, l) => t + l.percent, 0) || 1;
      const scaled = sanitizedLines.map((l) => ({
        ...l,
        percent: Math.max(0, Math.round((l.percent * 100) / sum)),
      }));
      const scaledSum = scaled.reduce((t, l) => t + l.percent, 0);
      const delta = 100 - scaledSum;
      scaled[scaled.length - 1] = {
        ...scaled[scaled.length - 1]!,
        percent: Math.max(0, scaled[scaled.length - 1]!.percent + delta),
      };

      const recomputed = scaled.map((l) => ({
        ...l,
        amountUsd: Math.round((input.budgetUsd * l.percent) / 100),
      }));

      return {
        coupleTagline: String(plan.coupleTagline ?? "A wedding concept you'll love"),
        conceptSummary: String(
          plan.conceptSummary ??
            `A ${input.theme} wedding in ${input.country} with a ${input.colorPalette} palette.`,
        ),
        venues: normalizedVenues,
        budget: { totalUsd: input.budgetUsd, lines: recomputed },
        slides: normalizedSlides,
      };
    };

    const plan = normalizePlan(rawPlan);

    const assetsBaseDir = (() => {
      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      return path.resolve(__dirname, "..", "assets");
    })();

    const generatedDir = path.join(assetsBaseDir, "generated");
    ensureDir(generatedDir);

    const runId = sha256Base64Url(
      JSON.stringify({
        ...input,
        // Salt with a small random component so repeated runs can differ.
        nonce: crypto.randomBytes(8).toString("hex"),
      }),
    ).slice(0, 16);

    const runSlug = [
      safeSlug(input.country),
      safeSlug(input.theme),
      String(input.guestCount),
      runId,
    ]
      .filter(Boolean)
      .join("-");

    const runDir = path.join(generatedDir, "wedding-pitch-deck", runSlug);
    ensureDir(runDir);

    // Generate images for slides.
    const slides: Slide[] = plan.slides.map((s) => ({ ...s }));
    const maxImages = 8;
    let generatedCount = 0;

    for (let i = 0; i < slides.length; i += 1) {
      const slide = slides[i];
      if (!slide || !slide.imagePrompt || generatedCount >= maxImages) continue;

      const imagePrompt = [
        "High-end wedding editorial photography style.",
        "No text, no logos, no watermarks.",
        `Country inspiration: ${input.country}.`,
        `Theme: ${input.theme}.`,
        `Color palette: ${input.colorPalette}.`,
        `Slide intent: ${slide.title}.`,
        "",
        slide.imagePrompt,
      ].join("\n");

      const { bytes, ext } = await openaiGenerateImage({
        apiKey,
        prompt: imagePrompt,
        size: "1024x1024",
      });

      const imageFile = `slide-${String(i + 1).padStart(2, "0")}.${ext}`;
      const imagePath = path.join(runDir, imageFile);
      await fs.promises.writeFile(imagePath, bytes);

      // URL served via MCP static assets server.
      slide.imageUrl = `/assets/generated/wedding-pitch-deck/${runSlug}/${imageFile}`;
      generatedCount += 1;
    }

    // Build venues with TripAdvisor search URLs.
    const venues: Venue[] = plan.venues.map((v) => ({
      ...v,
      tripadvisorSearchUrl: toTripAdvisorSearchUrl(
        `${v.name} ${v.location} ${input.country} wedding venue`,
      ),
    }));

    // Budget CSV export.
    const budgetLines = plan.budget.lines ?? [];
    const budgetCsv = createBudgetCsv(budgetLines, input.budgetUsd);
    const budgetCsvName = `budget-${runSlug}.csv`;
    const budgetCsvPath = path.join(runDir, budgetCsvName);
    await fs.promises.writeFile(budgetCsvPath, budgetCsv, "utf8");
    const budgetCsvUrl = `/assets/generated/wedding-pitch-deck/${runSlug}/${budgetCsvName}`;

    // PDF export.
    const pdfName = `deck-${runSlug}.pdf`;
    const pdfPath = path.join(runDir, pdfName);
    await buildDeckPdf({
      slides,
      assetBaseDir: assetsBaseDir,
      pdfPath,
    });
    const pdfUrl = `/assets/generated/wedding-pitch-deck/${runSlug}/${pdfName}`;

    return {
      content: [
        {
          type: "text",
          text: `Generated a wedding pitch deck PDF, venue shortlist, and budget CSV for ${input.country}.`,
        },
      ],
      structuredContent: {
        inputs: input,
        plan: {
          ...plan,
          venues,
          slides,
          budget: {
            totalUsd: input.budgetUsd,
            lines: budgetLines,
          },
        },
        exports: {
          pdfUrl,
          pdfName,
          budgetCsvUrl,
          budgetCsvName,
          generatedAssetsPrefix: `/assets/generated/wedding-pitch-deck/${runSlug}/`,
        },
      },
    };
  },
});

