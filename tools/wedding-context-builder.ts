import { defineTool } from "../utils/define-tool";
import { buildWeddingSnapshot } from "./wedding-domain/engine";
import { coupleContextInputSchema } from "./wedding-domain/schemas";

export default defineTool({
  name: "wedding-context-builder",
  title: "Build Wedding Snapshot",
  description:
    "Create a structured wedding snapshot with complexity score, priorities, and recommended planning pillar.",
  annotations: {
    readOnlyHint: true,
    openWorldHint: false,
    destructiveHint: false,
  },
  input: coupleContextInputSchema,
  ui: "wedding-context",
  invoking: "Building couple context",
  invoked: "Wedding snapshot ready",
  async handler(input) {
    const snapshot = buildWeddingSnapshot(input);

    return {
      content: [
        {
          type: "text",
          text:
            "Wedding Snapshot created with budget tier, complexity score, strategic priorities, and a recommended starting pillar.",
        },
      ],
      structuredContent: {
        snapshot,
        nextStep:
          "Proceed to venue strategy to choose venue types and booking timeline based on this snapshot.",
      },
    };
  },
});
