import { z } from 'zod';

/**
 * 公历日期参数 Schema
 */
export const SolarDateSchema = z.object({
  year: z.number().int().min(1900),
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31),
});

/**
 * 农历日期参数 Schema
 */
export const LunarDateSchema = z.object({
  year: z.number().int().min(1900),
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(30),
  isLeapMonth: z.boolean().optional(),
});

/**
 * 时辰参数 Schema
 */
export const TimeSchema = z.object({
  earthlyBranch: z.string().optional(),
  hour: z.number().int().min(0).max(23).optional(),
});

/**
 * 性别 Schema
 */
export const GenderSchema = z.enum(['male', 'female']);

/**
 * 星盘创建选项完整 Schema
 */
export const AstrolabeOptionsSchema = z.object({
  dateType: z.enum(['solar', 'lunar']),
  date: z.string().regex(/^\d{4}-\d{1,2}-\d{1,2}$/, '日期格式必须为 YYYY-M-D'),
  timeIndex: z.number().int().min(0).max(12).optional().default(0)
    .describe('时辰索引（0=子时~11=亥时, 12=晚子时）。与hour/time二选一'),
  hour: z.number().int().min(0).max(23).optional()
    .describe('出生小时(0-23)，如09:35填9。MCP自动换算时辰'),
  time: z.string().regex(/^\d{1,2}:\d{2}$/, '格式HH:MM，如09:15').optional()
    .describe('出生时间字符串，如"09:15"、"9:35"。MCP自动提取小时并换算时辰'),
  gender: GenderSchema,
  isLeapMonth: z.boolean().optional().default(false),
  fixLeap: z.boolean().optional().default(true),
  language: z
    .enum(['zh-CN', 'zh-TW', 'en-US', 'ja-JP', 'ko-KR', 'vi-VN'])
    .optional()
    .default('zh-CN'),
  astroType: z.enum(['heaven', 'earth', 'human']).optional().default('heaven'),
  longitude: z.number().min(-180).max(180).optional()
    .describe('出生地经度（东经为正）。AI可根据用户提供的城市名自行推断经纬度，如北京=116.4、上海=121.5'),
  latitude: z.number().min(-90).max(90).optional()
    .describe('出生地纬度（北纬为正），可选'),
  config: z
    .object({
      yearDivide: z.enum(['normal', 'exact']).optional(),
      horoscopeDivide: z.enum(['normal', 'exact']).optional(),
      ageDivide: z.enum(['normal', 'birthday']).optional(),
      dayDivide: z.enum(['current', 'forward']).optional(),
      algorithm: z.enum(['default', 'zhongzhou']).optional(),
    })
    .optional(),
});

/** 公历日期类型 */
export type SolarDate = z.infer<typeof SolarDateSchema>;

/** 农历日期类型 */
export type LunarDate = z.infer<typeof LunarDateSchema>;

/** 时辰参数类型 */
export type TimeInput = z.infer<typeof TimeSchema>;

/** 性别类型 */
export type Gender = z.infer<typeof GenderSchema>;

/** 星盘创建选项类型 */
export type AstrolabeOptions = z.infer<typeof AstrolabeOptionsSchema>;
