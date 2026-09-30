import { z } from 'zod';

export const DeviceSpecSchema = z.object({
  id: z.string().min(2),
  slug: z.string().min(2),
  brand: z.enum(['apple', 'samsung', 'google', 'xiaomi', 'huawei', 'standard']),
  category: z.enum(['phone', 'watch', 'tablet', 'ruler', 'calibration', 'accessory']),
  modelRu: z.string().min(1),
  modelEn: z.string().min(1),
  releaseYear: z.number().int().min(2000).max(2030),
  widthMm: z.number().positive(),
  heightMm: z.number().positive(),
  thicknessMm: z.number().positive().optional(),
  weightGrams: z.number().positive().optional(),
  screenDiagonalInches: z.number().positive().optional(),
  screenWidthPx: z.number().int().positive().optional(),
  screenHeightPx: z.number().int().positive().optional(),
  aspectRatio: z.string().optional(),
  bezelsMm: z.object({
    top: z.number().nonnegative(),
    bottom: z.number().nonnegative(),
    left: z.number().nonnegative(),
    right: z.number().nonnegative(),
  }).optional(),
});

export type DeviceSpec = z.infer<typeof DeviceSpecSchema>;
