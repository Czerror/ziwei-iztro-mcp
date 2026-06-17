import { z } from 'zod';

/** 日期参数统一描述文本 */
export const DATE_DESCRIPTION =
  '出生日期，格式 YYYY-M-D（如 1990-5-20 或 1990-05-20，月日可不补零）。公历时使用公历日期，农历时使用农历日期。AI 应从用户输入中提取日期，无需询问格式细节。';

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
export const GenderSchema = z.enum(['male', 'female']).describe(
  '性别：male=男, female=女。支持中文别名（"男"/"女"）',
);

/**
 * 星盘创建选项完整 Schema
 */
export const AstrolabeOptionsSchema = z.object({
  dateType: z.enum(['solar', 'lunar']).describe(
    '日期类型。solar=公历（阳历），lunar=农历（阴历）。AI 应根据用户表述推断：提到\'农历\'/\'阴历\'/\'正月\'等选 lunar，默认 solar。支持中文别名（\'公历\'/\'农历\'）。',
  ),
  date: z.string().regex(/^\d{4}-\d{1,2}-\d{1,2}$/, '日期格式必须为 YYYY-M-D').describe(DATE_DESCRIPTION),
  timeIndex: z.number().int().min(0).max(12).optional().default(0)
    .describe('时辰索引（0=子时~11=亥时, 12=晚子时）。优先级最低：仅在未提供 hour 或 time 时生效。默认值 0。'),
  hour: z.number().int().min(0).max(23).optional()
    .describe('出生小时(0-23)，如09:35填9。MCP自动换算时辰。优先级中等：低于 time 参数。如用户说\'早上9点\'则填 9。'),
  time: z.string().regex(/^\d{1,2}:\d{2}$/, '格式HH:MM，如09:15').optional()
    .describe('出生时间字符串，如"09:15"、"9:35"。MCP自动提取小时并换算时辰。优先级最高：会覆盖 hour 和 timeIndex。AI 应优先使用此参数，格式 HH:mm。'),
  gender: GenderSchema,
  isLeapMonth: z.boolean().optional().default(false)
    .describe('是否为农历闰月。仅 dateType="lunar" 时有效，默认 false。'),
  fixLeap: z.boolean().optional().default(true)
    .describe('是否自动修正闰月。默认 true，一般无需修改。'),
  astroType: z.enum(['heaven', 'earth', 'human']).optional().default('heaven')
    .describe('星盘类型。heaven=天盘（默认，最常用），earth=地盘，human=人盘。一般用户无需指定，使用默认值即可。支持中文别名（"天盘"/"地盘"/"人盘"）。'),
  longitude: z.number().min(-180).max(180).optional()
    .describe('出生地经度（东经为正，西经为负）。AI 应根据用户提供的城市名自行推断，如北京≈116.4、上海≈121.5、台北≈121.6。'),
  latitude: z.number().min(-90).max(90).optional()
    .describe('出生地纬度（北纬为正，南纬为负）。AI 应根据用户提供的城市名自行推断，如北京≈39.9、上海≈31.2、台北≈25.0。'),
  birthplace: z.string().optional().describe(
    '出生地（仅供参考，不参与服务端计算）。AI 应根据此城市名自行推断经纬度，并通过 longitude/latitude 参数传入。',
  ),
  config: z
    .object({
      yearDivide: z.enum(['normal', 'exact']).optional()
        .describe('年分界点。normal=正月初一，exact=立春（精确分界）'),
      horoscopeDivide: z.enum(['normal', 'exact']).optional()
        .describe('运限分界点。normal=正月初一，exact=立春'),
      ageDivide: z.enum(['normal', 'birthday']).optional()
        .describe('小限分界点。normal=正月初一，birthday=生日当天'),
      dayDivide: z.enum(['current', 'forward']).optional()
        .describe('晚子时处理。current=当天，forward=次日'),
      algorithm: z.enum(['default', 'zhongzhou']).optional()
        .describe('安星算法。default=默认，zhongzhou=中州派'),
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
