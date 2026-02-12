import { defineTool } from "../utils/define-tool";
import {
  buildVenueStrategyBrief,
  buildWeddingSnapshot,
} from "./wedding-domain/engine";
import { coupleContextInputSchema } from "./wedding-domain/schemas";

export default defineTool({
  name: "wedding-venue-strategy",
  title: "Generate Venue Strategy",
  description:
    "Generate venue recommendations, decision checklist, and booking timeline from couple context.",
  annotations: {
    readOnlyHint: true,
    openWorldHint: false,
    destructiveHint: false,
  },
  input: coupleContextInputSchema,
  ui: "wedding-venue-strategy",
  invoking: "Building venue strategy",
  invoked: "Venue strategy ready",
  async handler(input) {
    const snapshot = buildWeddingSnapshot(input);
    const venueStrategyBrief = buildVenueStrategyBrief(snapshot.normalizedContext, snapshot);

    return {
      content: [
        {
          type: "text",
          text:
            "Venue Strategy Brief generated with matched venue types, critical checklist, and booking/deposit guidance.",
        },
      ],
      structuredContent: {
        snapshot,
        venueStrategyBrief,
        nextStep:
          "Proceed to budget architecture to map spending allocations, timeline phases, and risk controls.",
      },
    };
  },
});
