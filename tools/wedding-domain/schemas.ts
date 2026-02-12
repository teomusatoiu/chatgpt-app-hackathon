import { z } from "zod/v3";

export const weddingSeasonSchema = z.enum([
  "spring",
  "summer",
  "fall",
  "winter",
]);

export const weddingPrioritySchema = z.enum([
  "food",
  "party",
  "elegance",
  "intimacy",
  "photos",
]);

export const coupleContextInputSchema = z
  .object({
    location: z.string().min(2).describe("Primary wedding location."),
    weddingDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .describe("Wedding date in ISO format (YYYY-MM-DD)."),
    weddingSeason: weddingSeasonSchema
      .optional()
      .describe("Season if exact date is not finalized."),
    guestCount: z
      .number()
      .int()
      .min(10)
      .max(400)
      .describe("Estimated guest count."),
    budgetMin: z
      .number()
      .min(1000)
      .describe("Lower bound of wedding budget in USD."),
    budgetMax: z
      .number()
      .min(1000)
      .describe("Upper bound of wedding budget in USD."),
    priorities: z
      .array(weddingPrioritySchema)
      .length(3)
      .describe("Top three wedding priorities."),
    vibeWords: z
      .array(z.string().min(2))
      .min(1)
      .max(5)
      .describe("Descriptive vibe words for the celebration."),
    nonNegotiable: z
      .string()
      .min(3)
      .describe("One non-negotiable wedding requirement."),
  })
  .superRefine((value, ctx) => {
    if (!value.weddingDate && !value.weddingSeason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide either weddingDate or weddingSeason.",
        path: ["weddingDate"],
      });
    }

    if (value.budgetMax < value.budgetMin) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "budgetMax must be greater than or equal to budgetMin.",
        path: ["budgetMax"],
      });
    }

    if (new Set(value.priorities).size !== value.priorities.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "priorities must contain three distinct values.",
        path: ["priorities"],
      });
    }

    if (value.weddingDate) {
      const parsedDate = new Date(`${value.weddingDate}T00:00:00Z`);
      if (Number.isNaN(parsedDate.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "weddingDate must be a valid calendar date.",
          path: ["weddingDate"],
        });
      }
    }
  });

export type CoupleContextInput = z.infer<typeof coupleContextInputSchema>;
