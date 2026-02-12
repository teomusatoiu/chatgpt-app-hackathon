import { z } from "zod/v3";
import { defineTool } from "../utils/define-tool";
import { addTask, getWeddingDashboardData } from "./wedding-store";

const addTaskInput = z.object({
  title: z.string().trim().min(1).describe("Task title."),
  due_date: z.string().trim().min(1).describe("Task due date as a string."),
});

export default defineTool({
  name: "addTask",
  title: "Add Task",
  description: "Add a task to the wedding checklist.",
  annotations: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  input: addTaskInput,
  ui: "wedding-planner-dashboard",
  invoking: "Adding task",
  invoked: "Task added",
  async handler(input) {
    const task = addTask(input);

    return {
      content: [
        {
          type: "text",
          text: `Task "${task.title}" added with due date ${task.due_date}.`,
        },
      ],
      structuredContent: {
        view: "tasks",
        data: getWeddingDashboardData(),
      },
    };
  },
});
