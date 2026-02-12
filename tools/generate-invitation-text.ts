import { z } from "zod/v3";
import { defineTool } from "../utils/define-tool";
import {
  getWeddingDashboardData,
  setLatestInvitation,
} from "./wedding-store";

const generateInvitationTextInput = z.object({
  theme: z
    .string()
    .trim()
    .min(1)
    .transform((value) => value.toLowerCase())
    .describe("Invitation theme, for example casual, formal, or romantic."),
});

function buildInvitationText(theme: string): string {
  if (theme === "casual") {
    return "We are getting married and would love to celebrate with you! Join us for a fun and joyful day as we say I do.";
  }

  if (theme === "formal") {
    return "Together with their families, the couple requests the honor of your presence at their wedding ceremony and reception.";
  }

  if (theme === "romantic") {
    return "With hearts full of love, we invite you to share in our wedding day as we begin our forever together.";
  }

  return `You are warmly invited to our wedding celebration. Theme: ${theme}. We hope you can join us on our special day.`;
}

export default defineTool({
  name: "generateInvitationText",
  title: "Generate Invitation Text",
  description: "Generate an invitation message based on a theme.",
  annotations: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  input: generateInvitationTextInput,
  ui: "wedding-planner-dashboard",
  invoking: "Generating invitation text",
  invoked: "Invitation text ready",
  async handler(input) {
    const invitationText = buildInvitationText(input.theme);
    const invitation = setLatestInvitation(input.theme, invitationText);

    return {
      content: [{ type: "text", text: invitation.text }],
      structuredContent: {
        view: "invitation",
        invitation_text: invitation.text,
        data: getWeddingDashboardData(),
      },
    };
  },
});
