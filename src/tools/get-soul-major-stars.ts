import { z } from 'zod';
import { astro } from 'iztro';

import { LanguageSchema } from '../schemas/common.js';
import { toJSON } from '../utils/format.js';
import { handleError } from '../utils/errors.js';

const GetSoulMajorStarsInputSchema = z.object({
  dateType: z.enum(['solar', 'lunar']),
  date: z.string().regex(/^\d{4}-\d{1,2}-\d{1,2}$/, '日期格式必须为 YYYY-M-D'),
  timeIndex: z.number().int().min(0).max(12),
  isLeapMonth: z.boolean().optional().default(false),
  fixLeap: z.boolean().optional().default(true),
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
