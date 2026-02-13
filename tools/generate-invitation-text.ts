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

const OPENAI_API_BASE_URL = "https://api.openai.com/v1";
const INVITATION_TEXT_MODEL = "gpt-5.2";
const INVITATION_IMAGE_MODELS = ["gpt-image-1.5", "gpt-image-1"] as const;

function buildFallbackInvitationText(theme: string): string {
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getApiKey(): string {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set.");
  }
  return apiKey;
}

async function callOpenAi(pathname: string, payload: unknown): Promise<unknown> {
  const response = await fetch(`${OPENAI_API_BASE_URL}${pathname}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `OpenAI request failed (${response.status}): ${errorBody.slice(0, 240)}`,
    );
  }

  return response.json();
}

function extractResponseText(response: unknown): string | null {
  if (!isRecord(response)) {
    return null;
  }

  const directOutputText = response.output_text;
  if (typeof directOutputText === "string" && directOutputText.trim()) {
    return directOutputText.trim();
  }

  const output = response.output;
  if (!Array.isArray(output)) {
    return null;
  }

  const chunks: string[] = [];

  output.forEach((item) => {
    if (!isRecord(item) || item.type !== "message") {
      return;
    }

    const content = item.content;
    if (!Array.isArray(content)) {
      return;
    }

    content.forEach((part) => {
      if (!isRecord(part) || part.type !== "output_text") {
        return;
      }

      if (typeof part.text === "string" && part.text.trim()) {
        chunks.push(part.text.trim());
      }
    });
  });

  if (chunks.length === 0) {
    return null;
  }

  return chunks.join("\n\n").trim();
}

function buildImagePrompt(theme: string): string {
  return [
    "A cute, joyful illustration of a happy couple celebrating their wedding engagement.",
    `Theme: ${theme}.`,
    "Warm lighting, elegant floral details, soft pastel palette, romantic mood.",
    "No visible text, no logo, no watermark.",
  ].join(" ");
}

function extractGeneratedImageUrl(response: unknown): string | null {
  if (!isRecord(response) || !Array.isArray(response.data) || response.data.length === 0) {
    return null;
  }

  const firstImage = response.data[0];
  if (!isRecord(firstImage)) {
    return null;
  }

  if (typeof firstImage.url === "string" && firstImage.url.trim()) {
    return firstImage.url.trim();
  }

  if (typeof firstImage.b64_json === "string" && firstImage.b64_json.trim()) {
    return `data:image/png;base64,${firstImage.b64_json.trim()}`;
  }

  return null;
}

async function generateInvitationText(theme: string): Promise<string> {
  const response = await callOpenAi("/responses", {
    model: INVITATION_TEXT_MODEL,
    reasoning: { effort: "none" },
    text: { verbosity: "low" },
    max_output_tokens: 180,
    input: [
      {
        role: "developer",
        content: [
          {
            type: "input_text",
            text: "Write a cute wedding invitation message. Return only the final invitation text in 2-3 short sentences.",
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `Theme: ${theme}`,
          },
        ],
      },
    ],
  });

  const text = extractResponseText(response);
  if (!text) {
    throw new Error("Text response was empty.");
  }

  return text;
}

async function generateInvitationImage(theme: string): Promise<string | null> {
  let lastError: Error | null = null;

  for (const model of INVITATION_IMAGE_MODELS) {
    try {
      const response = await callOpenAi("/images/generations", {
        model,
        prompt: buildImagePrompt(theme),
        n: 1,
        size: "1024x1024",
      });

      return extractGeneratedImageUrl(response);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown image generation error.");
    }
  }

  if (lastError) {
    throw lastError;
  }

  return null;
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
    let invitationText = buildFallbackInvitationText(input.theme);
    let invitationImageUrl: string | null = null;

    if (process.env.OPENAI_API_KEY?.trim()) {
      try {
        invitationText = await generateInvitationText(input.theme);
      } catch (error) {
        console.error("Failed to generate invitation text with GPT-5.2", error);
      }

      try {
        invitationImageUrl = await generateInvitationImage(input.theme);
      } catch (error) {
        console.error("Failed to generate invitation image", error);
      }
    }

    const invitation = setLatestInvitation(
      input.theme,
      invitationText,
      invitationImageUrl,
    );

    return {
      content: [{ type: "text", text: invitation.text }],
      structuredContent: {
        view: "invitation",
        invitation_text: invitation.text,
        invitation_image_url: invitation.image_url,
        data: getWeddingDashboardData(),
      },
    };
  },
});
