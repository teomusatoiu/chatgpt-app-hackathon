import { z } from "zod/v3";
import { defineTool } from "../utils/define-tool";
import {
  getWeddingDashboardData,
  type RSVPStatus,
  updateGuestStatus,
} from "./wedding-store";

const rsvpValues = ["Yes", "No", "Maybe", "Pending"] as const;

const updateGuestStatusInput = z.object({
  guest_id: z.string().trim().min(1).describe("Guest id like guest_1."),
  rsvp_status: z
    .enum(rsvpValues)
    .describe("RSVP status: Yes, No, Maybe, or Pending."),
});

export default defineTool({
  name: "updateGuestStatus",
  title: "Update Guest RSVP Status",
  description: "Update guest RSVP status.",
  annotations: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  input: updateGuestStatusInput,
  ui: "wedding-planner-dashboard",
  invoking: "Updating RSVP status",
  invoked: "RSVP updated",
  async handler(input) {
    const guest = updateGuestStatus(
      input.guest_id,
      input.rsvp_status as RSVPStatus,
    );

    return {
      content: [
        {
          type: "text",
          text: `Updated RSVP for ${guest.name} to ${guest.rsvp_status}.`,
        },
      ],
      structuredContent: {
        view: "guests",
        data: getWeddingDashboardData(),
      },
    };
  },
});
