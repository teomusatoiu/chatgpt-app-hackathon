import { defineTool } from "../utils/define-tool";
import {
  buildBudgetPlanningBundle,
  buildWeddingSnapshot,
} from "./wedding-domain/engine";
import { coupleContextInputSchema } from "./wedding-domain/schemas";

export default defineTool({
  name: "wedding-budget-architecture",
  title: "Build Budget & Timeline",
  description:
    "Generate personalized budget allocation, phased task timeline, and top planning risks.",
  annotations: {
    readOnlyHint: true,
    openWorldHint: false,
    destructiveHint: false,
  },
  input: coupleContextInputSchema,
  ui: "wedding-budget-architecture",
  invoking: "Building budget model",
  invoked: "Budget model ready",
  async handler(input) {
    const snapshot = buildWeddingSnapshot(input);
    const budgetPlanning = buildBudgetPlanningBundle(snapshot.normalizedContext, snapshot);

    return {
      content: [
        {
          type: "text",
          text:
            "Budget Architecture generated with category allocations, dynamic timeline phases, and a 3-point risk radar.",
        },
      ],
      structuredContent: {
        snapshot,
        ...budgetPlanning,
        nextStep:
          "Proceed to design direction to translate your vibe words into palette, textures, and styling guidance.",
      },
    };
  },
});
