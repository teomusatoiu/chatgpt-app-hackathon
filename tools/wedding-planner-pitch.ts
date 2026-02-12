import { defineTool } from "../utils/define-tool";
import { buildWeddingPlanningBundle } from "./wedding-domain/engine";
import { coupleContextInputSchema } from "./wedding-domain/schemas";

export default defineTool({
  name: "wedding-planner-pitch",
  title: "Create Planner Pitch",
  description:
    "Generate a complete planner-style proposal that ties together venue strategy, budget architecture, and design direction.",
  annotations: {
    readOnlyHint: true,
    openWorldHint: false,
    destructiveHint: false,
  },
  input: coupleContextInputSchema,
  ui: "wedding-planner-pitch",
  invoking: "Drafting planner pitch",
  invoked: "Planner pitch ready",
  async handler(input) {
    const bundle = buildWeddingPlanningBundle(input);

    return {
      content: [
        {
          type: "text",
          text: bundle.plannerPitch.markdown,
        },
      ],
      structuredContent: {
        snapshot: bundle.snapshot,
        venueStrategyBrief: bundle.venueStrategyBrief,
        budgetPlanning: bundle.budgetPlanning,
        designDirection: bundle.designDirection,
        plannerPitch: bundle.plannerPitch,
      },
    };
  },
});
