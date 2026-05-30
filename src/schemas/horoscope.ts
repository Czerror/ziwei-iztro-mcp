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
    .optional(),
  timeIndex: z.number().int().min(0).max(12).optional(),
});

/** 运限类型 */
export type HoroscopeType = z.infer<typeof HoroscopeTypeSchema>;

/** 运限查询索引参数类型 */
export type HoroscopeIndex = z.infer<typeof HoroscopeIndexSchema>;
