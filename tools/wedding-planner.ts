import { z } from "zod/v3";
import { defineTool } from "../utils/define-tool";
import { issueWeddingIntakeSessionId } from "./wedding-intake-store";

// Purpose: open the wedding widget in "intake mode" (no generation yet).
// The widget then collects inputs and calls `wedding-pitch-deck`.
const weddingPlannerInput = z.object({}).describe("No inputs. Opens the planner UI.");

export default defineTool({
  name: "wedding-planner",
  title: "Wedding Planner: Start (Intake)",
  description:
    "Open the wedding planner UI to enter inputs (country, budget, guests, theme, colors) before generating a pitch deck.",
  annotations: {
    readOnlyHint: true,
    openWorldHint: false,
    destructiveHint: false,
  },
  input: weddingPlannerInput,
  ui: "wedding-pitch-deck",
  invoking: "Opening wedding planner",
  invoked: "Wedding planner opened",
  async handler() {
    const intakeSessionId = issueWeddingIntakeSessionId();
    return {
      content: [{ type: "text", text: "Opened the wedding planner intake UI." }],
      structuredContent: {
        inputs: {
          intakeSessionId,
          country: "",
          budgetUsd: 50000,
          guestCount: 120,
          theme: "",
          colorPalette: "",
          venueCount: 5,
          slideCount: 10,
        },
        plan: {
          coupleTagline: "Wedding pitch deck",
          conceptSummary:
            "Enter your inputs on the left, then click Regenerate to generate the PDF deck, venues, and budget.",
          venues: [],
          budget: { totalUsd: 50000, lines: [] },
          slides: [],
        },
        exports: {
          pdfUrl: "",
          pdfName: "",
          budgetCsvUrl: "",
          budgetCsvName: "",
        },
      },
    };
  },
});

