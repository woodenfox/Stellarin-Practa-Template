import { z } from "zod";

export const practaMetadataSchema = z.object({
  type: z.string(),
  name: z.string(),
  description: z.string(),
  author: z.string(),
  version: z.string(),
  estimatedDuration: z.number().optional(),
});

export type PractaMetadata = z.infer<typeof practaMetadataSchema>;
