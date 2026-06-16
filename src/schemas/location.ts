import { z } from 'zod';

export const SolarTimeSchema = z.object({
  time: z
    .string()
    .min(1)
    .describe(
      '时间输入，支持格式：具体时间(14:30)、时间范围(13-15, 取中间值14:00)、时辰(丑时, 不进行真太阳时修正)',
    ),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式必须为 YYYY-MM-DD')
    .describe('日期，格式 YYYY-MM-DD'),
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
  useSolarTime: z
    .boolean()
    .optional()
    .default(false)
    .describe('是否启用真太阳时修正，默认 false 不修正'),
});

export type SolarTimeInput = z.infer<typeof SolarTimeSchema>;
