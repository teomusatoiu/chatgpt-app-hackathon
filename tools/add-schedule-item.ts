import { z } from "zod/v3";
import { defineTool } from "../utils/define-tool";
import { addScheduleItem, getWeddingDashboardData } from "./wedding-store";

const addScheduleItemInput = z.object({
  time: z.string().trim().min(1).describe("Time of schedule item."),
  description: z.string().trim().min(1).describe("Schedule item description."),
});

export default defineTool({
  name: "addScheduleItem",
  title: "Add Schedule Item",
  description: "Add a wedding day schedule item.",
  annotations: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  input: addScheduleItemInput,
  ui: "wedding-planner-dashboard",
  invoking: "Adding schedule item",
  invoked: "Schedule item added",
  async handler(input) {
    const item = addScheduleItem(input);

    return {
      content: [
        {
          type: "text",
          text: `Added schedule item at ${item.time}: ${item.description}`,
        },
      ],
      structuredContent: {
        view: "schedule",
        data: getWeddingDashboardData(),
      },
    };
  },
});
