import { z } from 'zod';

export const LocationRecordSchema = z.object({
  id: z.string().min(2),
  slug: z.string().min(2),
  nameRu: z.string().min(1),
  nameEn: z.string().min(1),
  countryRu: z.string().min(1),
  countryEn: z.string().min(1),
  countryCode: z.string().length(2),
  continent: z.enum(['europe', 'asia', 'north-america', 'south-america', 'africa', 'oceania', 'antarctica']),
  timezoneIana: z.string().min(3),
  utcOffsetMinutes: z.number().int(),
  hasDst: z.boolean(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  population: z.number().nonnegative().optional(),
  isCapital: z.boolean().default(false),
  popularOrder: z.number().int().optional(),
});

export type LocationRecord = z.infer<typeof LocationRecordSchema>;
export type TimeLocation = LocationRecord;
