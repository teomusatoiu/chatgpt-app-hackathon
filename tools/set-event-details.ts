import { z } from "zod/v3";
import { defineTool } from "../utils/define-tool";
import {
  getWeddingDashboardData,
  setEventDetails as setWeddingEventDetails,
} from "./wedding-store";

const setEventDetailsInput = z.object({
  event_date: z.string().trim().min(1).describe("Wedding date as a string."),
  location: z.string().trim().min(1).describe("Wedding location."),
  budget: z.number().min(0).describe("Wedding budget."),
});

export default defineTool({
  name: "setEventDetails",
  title: "Set Wedding Event Details",
  description: "Set the wedding date, location, and budget.",
  annotations: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  input: setEventDetailsInput,
  ui: "wedding-planner-dashboard",
  invoking: "Saving event details",
  invoked: "Event details saved",
  async handler(input) {
    const eventDetails = setWeddingEventDetails(input);

    return {
      content: [
        {
          type: "text",
          text: `Wedding details set for ${eventDetails.event_date} in ${eventDetails.location} with a budget of $${eventDetails.budget}.`,
        },
      ],
      structuredContent: {
        view: "event",
        data: getWeddingDashboardData(),
      },
    };
  },
});
