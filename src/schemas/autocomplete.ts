import { z } from "zod";

export const autocompleteQuerySchema = z.string().trim().min(1).max(200);

const matchReasonSchema = z.object({
  type: z.enum(["name", "substance", "atc", "indication"]),
  label: z.string(),
});

const suggestionTypeSchema = z.enum(["specialite", "substance", "indication"]);

const suggestionSchema = z.object({
  type: suggestionTypeSchema,
  label: z.string(),
  href: z.string(),
  score: z.number(),
  matchReasons: z.array(matchReasonSchema).optional(),
});

const sectionSchema = z.object({
  type: suggestionTypeSchema,
  title: z.string(),
  highestScore: z.number(),
  items: z.array(suggestionSchema),
});

export const autocompleteResponseSchema = z.array(sectionSchema);

export type MatchReason = z.infer<typeof matchReasonSchema>;
export type AutocompleteSuggestionType = z.infer<typeof suggestionTypeSchema>;
export type AutocompleteSuggestion = z.infer<typeof suggestionSchema>;
export type AutocompleteSection = z.infer<typeof sectionSchema>;
