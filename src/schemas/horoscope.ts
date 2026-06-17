import { z } from 'zod';

/**
 * 运限类型 Schema
 */
export const HoroscopeTypeSchema = z.enum(['decadal', 'yearly', 'monthly', 'daily', 'hourly']);

/**
 * 运限查询索引参数 Schema
 */
export const HoroscopeIndexSchema = z.object({
  targetDate: z
    .string()
    .regex(/^\d{4}-\d{1,2}-\d{1,2}$/, '日期格式必须为 YYYY-M-D')
    .describe('目标日期，格式 YYYY-M-D（如 1990-5-20 或 1990-05-20，月日可不补零）。公历时使用公历日期，农历时使用农历日期。AI 应从用户输入中提取日期，无需询问格式细节。')
    .optional(),
  timeIndex: z.number().int().min(0).max(12).optional(),
});

/** 运限类型 */
export type HoroscopeType = z.infer<typeof HoroscopeTypeSchema>;

/** 运限查询索引参数类型 */
export type HoroscopeIndex = z.infer<typeof HoroscopeIndexSchema>;
