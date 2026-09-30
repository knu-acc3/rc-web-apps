import { z } from 'zod';

export const EmojiItemSchema = z.object({
  id: z.string().min(1),
  char: z.string().min(1),
  nameRu: z.string().min(1),
  nameEn: z.string().min(1),
  group: z.string().min(1),
  subgroup: z.string().min(1),
  codePoint: z.string().min(2),
  unicodeVersion: z.string(),
  keywordsRu: z.array(z.string()),
  keywordsEn: z.array(z.string()),
  hasSkinTone: z.boolean().default(false),
  variations: z.array(z.string()).optional(),
});

export type EmojiItem = z.infer<typeof EmojiItemSchema>;

export interface EmojiCategory {
  readonly id: string;
  readonly nameRu: string;
  readonly nameEn: string;
  readonly icon: string;
}
