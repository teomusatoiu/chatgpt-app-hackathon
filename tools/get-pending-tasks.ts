import { z } from "zod/v3";
import { defineTool } from "../utils/define-tool";
import { getPendingTasks, getWeddingDashboardData } from "./wedding-store";

const getPendingTasksInput = z.object({});

export default defineTool({
  name: "getPendingTasks",
  title: "Get Pending Tasks",
  description: "Get the list of pending wedding tasks.",
  annotations: {
    readOnlyHint: true,
    openWorldHint: false,
    destructiveHint: false,
  },
  input: getPendingTasksInput,
  ui: "wedding-planner-dashboard",
  invoking: "Loading pending tasks",
  invoked: "Pending tasks loaded",
  async handler() {
    const pendingTasks = getPendingTasks();
    const message =
      pendingTasks.length > 0
        ? `Found ${pendingTasks.length} pending task(s).`
        : "No pending tasks left.";

    return {
      content: [{ type: "text", text: message }],
      structuredContent: {
        view: "tasks",
        data: getWeddingDashboardData(),
      },
    };
  },
});
