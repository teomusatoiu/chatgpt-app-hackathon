import { z } from "zod";
import { defineTool } from "../utils/define-tool";

const pizzaShopInput = z.object({
  pizzaTopping: z.string().describe("Topping to mention when rendering the widget."),
});

export default defineTool({
  name: "pizza-shop",
  title: "Open Pizzaz Shop",
  description: "Render the Pizzaz shop widget.",
  annotations: {
    readOnlyHint: true,
    openWorldHint: false,
    destructiveHint: false,
  },
  input: pizzaShopInput,
  ui: "pizza-shop",
  invoking: "Opening the shop",
  invoked: "Shop opened",
  componentName: "pizzaz-shop",
  async handler(input) {
    return {
      content: [{ type: "text", text: "Rendered the Pizzaz shop!" }],
      structuredContent: {
        pizzaTopping: input.pizzaTopping,
      },
    };
  },
});
