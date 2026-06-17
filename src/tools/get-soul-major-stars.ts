import { z } from 'zod';
import { astro } from 'iztro';

import { LanguageSchema } from '../schemas/common.js';
import { DATE_DESCRIPTION } from '../schemas/astro.js';
import { toJSON } from '../utils/format.js';
import { handleError } from '../utils/errors.js';
import { applyParamAliases, applyEnumAliases, DATE_TYPE_ALIASES } from '../utils/aliases.js';

const GetSoulMajorStarsInputSchema = z.object({
  dateType: z.enum(['solar', 'lunar']).describe(
    '日期类型。solar=公历（阳历），lunar=农历（阴历）。AI 应根据用户表述推断：提到\'农历\'/\'阴历\'/\'正月\'等选 lunar，默认 solar。支持中文别名（\'公历\'/\'农历\'）。',
  ),
  date: z.string().regex(/^\d{4}-\d{1,2}-\d{1,2}$/, '日期格式必须为 YYYY-M-D').describe(DATE_DESCRIPTION),
  timeIndex: z.number().int().min(0).max(12).optional().default(0)
    .describe('出生时辰索引，0=子时…12=晚子时，默认0。'),
  isLeapMonth: z.boolean().optional().default(false)
    .describe('是否为农历闰月。仅 dateType="lunar" 时有效，默认 false。'),
  fixLeap: z.boolean().optional().default(true)
    .describe('是否自动修正闰月。默认 true，一般无需修改。'),
  language: LanguageSchema.optional().default('zh-CN'),
});

type GetSoulMajorStarsInput = z.infer<typeof GetSoulMajorStarsInputSchema>;

/**
 * get_soul_major_stars Tool — 获取命宫主星（简化查询）
 *
 * 不需要创建完整星盘，直接返回命宫主星名称。若命宫为空宫则返回对宫主星（借宫安星）。
 */
export const getSoulMajorStarsTool = {
  name: 'get_soul_major_stars' as const,
  description:
    '获取命宫主星（简化查询）。不需要创建完整星盘，直接返回命宫主星列表。若命宫为空宫则自动借对宫主星。',
  inputSchema: GetSoulMajorStarsInputSchema,
  handler: async (input: GetSoulMajorStarsInput) => {
    try {
      input = applyParamAliases(input) as typeof input;
      applyEnumAliases(input, 'dateType', DATE_TYPE_ALIASES);
      let majorStars: string;

      if (input.dateType === 'solar') {
        majorStars = astro.getMajorStarBySolarDate(input.date, input.timeIndex, input.fixLeap, input.language);
      } else {
        majorStars = astro.getMajorStarByLunarDate(
          input.date,
          input.timeIndex,
          input.isLeapMonth,
          input.fixLeap,
          input.language,
        );
      }

      const result = { majorStars, date: input.date, timeIndex: input.timeIndex };

      return { content: [{ type: 'text' as const, text: toJSON(result) }] };
    } catch (error: unknown) {
      return handleError(error, 'get_soul_major_stars');
    }
  },
};
