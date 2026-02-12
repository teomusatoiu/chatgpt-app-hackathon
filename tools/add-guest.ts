import { z } from "zod/v3";
import { defineTool } from "../utils/define-tool";
import { addGuest, getWeddingDashboardData } from "./wedding-store";

const addGuestInput = z.object({
  name: z.string().trim().min(1).describe("Guest name."),
  contact: z.string().trim().min(1).describe("Guest contact information."),
});

export default defineTool({
  name: "addGuest",
  title: "Add Guest",
  description: "Add a wedding guest.",
  annotations: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  input: addGuestInput,
  ui: "wedding-planner-dashboard",
  invoking: "Adding guest",
  invoked: "Guest added",
  async handler(input) {
    const guest = addGuest(input);

    return {
      content: [
        {
          type: "text",
          text: `Guest ${guest.name} added with id ${guest.id}.`,
        },
      ],
      structuredContent: {
        view: "guests",
        guest_id: guest.id,
        data: getWeddingDashboardData(),
      },
    };
  },
});
