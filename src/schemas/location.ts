import { z } from 'zod';

export const SolarTimeSchema = z.object({
  beijingTime: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/, '时间格式必须为 YYYY-MM-DD HH:mm:ss'),
  longitude: z
    .number()
    .min(-180)
    .max(180)
    .describe('经度，东经为正'),
  latitude: z
    .number()
    .min(-90)
    .max(90)
    .optional()
    .describe('纬度，北纬为正，可选'),
});

export type SolarTimeInput = z.infer<typeof SolarTimeSchema>;
