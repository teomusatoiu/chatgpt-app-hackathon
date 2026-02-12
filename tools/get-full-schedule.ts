import { z } from "zod/v3";
import { defineTool } from "../utils/define-tool";
import { getFullSchedule, getWeddingDashboardData } from "./wedding-store";

const getFullScheduleInput = z.object({});

export default defineTool({
  name: "getFullSchedule",
  title: "Get Full Schedule",
  description: "Get the full wedding schedule.",
  annotations: {
    readOnlyHint: true,
    openWorldHint: false,
    destructiveHint: false,
  },
  input: getFullScheduleInput,
  ui: "wedding-planner-dashboard",
  invoking: "Loading full schedule",
  invoked: "Full schedule loaded",
  async handler() {
    const schedule = getFullSchedule();
    const message =
      schedule.length > 0
        ? `Loaded ${schedule.length} schedule item(s).`
        : "No schedule items yet.";

    return {
      content: [{ type: "text", text: message }],
      structuredContent: {
        view: "schedule",
        data: getWeddingDashboardData(),
      },
    };
  },
});
