import { z } from 'zod';

export const EventItemSchema = z.object({
  id: z.string(),
  slug: z.string(),
  nameRu: z.string(),
  nameEn: z.string(),
  descriptionRu: z.string().optional(),
  descriptionEn: z.string().optional(),
  calculationType: z.string().optional(),
  fixedMonth: z.number().optional(),
  fixedDay: z.number().optional(),
  targetYear: z.number().optional(),
  category: z.string().optional(),
  iconName: z.string().optional(),
});

export type EventItem = z.infer<typeof EventItemSchema>;

export const PresetItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string().optional(),
  minutes: z.number().optional(),
  workMinutes: z.number().optional(),
  breakMinutes: z.number().optional(),
  workSeconds: z.number().optional(),
  restSeconds: z.number().optional(),
  rounds: z.number().optional(),
  restMinutes: z.number().optional(),
});

export type PresetItem = z.infer<typeof PresetItemSchema>;
