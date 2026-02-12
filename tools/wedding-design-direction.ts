import { defineTool } from "../utils/define-tool";
import {
  buildDesignDirection,
  buildWeddingSnapshot,
} from "./wedding-domain/engine";
import { coupleContextInputSchema } from "./wedding-domain/schemas";

export default defineTool({
  name: "wedding-design-direction",
  title: "Generate Design Direction",
  description:
    "Translate vibe words into a concrete wedding aesthetic: palette, textures, lighting, florals, and dress code.",
  annotations: {
    readOnlyHint: true,
    openWorldHint: false,
    destructiveHint: false,
  },
  input: coupleContextInputSchema,
  ui: "wedding-design-direction",
  invoking: "Crafting design direction",
  invoked: "Design direction ready",
  async handler(input) {
    const snapshot = buildWeddingSnapshot(input);
    const designDirection = buildDesignDirection(snapshot.normalizedContext);

    return {
      content: [
        {
          type: "text",
          text:
            "Design direction generated with a tangible aesthetic concept tied to your priorities and vibe words.",
        },
      ],
      structuredContent: {
        snapshot,
        designDirection,
        nextStep:
          "Proceed to the planner pitch to synthesize strategy, budget architecture, and design into one proposal.",
      },
    };
  },
});
