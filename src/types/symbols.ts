import { z } from 'zod';

export const SymbolItemSchema = z.object({
  id: z.string().min(1),
  char: z.string().min(1),
  nameRu: z.string().min(1),
  nameEn: z.string().min(1),
  category: z.string().min(1),
  hexCode: z.string().min(2),
  decimalCode: z.number().int().positive(),
  htmlEntity: z.string().optional(),
  latexCommand: z.string().optional(),
  keywordsRu: z.array(z.string()),
  keywordsEn: z.array(z.string()),
});

export type SymbolItem = z.infer<typeof SymbolItemSchema>;
 
export const KaomojiItemSchema = z.object({
  id: z.string(),
  text: z.string(),
  category: z.string(),
  tags: z.array(z.string()).default([]),
  nameRu: z.string().optional(),
  nameEn: z.string().optional(),
});

export type KaomojiItem = z.infer<typeof KaomojiItemSchema>;
