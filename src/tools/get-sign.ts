import { z } from 'zod';
import { astro } from 'iztro';

import { LanguageSchema } from '../schemas/common.js';
import { DATE_DESCRIPTION } from '../schemas/astro.js';
import { toJSON } from '../utils/format.js';
import { handleError } from '../utils/errors.js';
import { applyParamAliases, applyEnumAliases, DATE_TYPE_ALIASES } from '../utils/aliases.js';

const GetSignInputSchema = z.object({
  dateType: z.enum(['solar', 'lunar']).describe(
    '日期类型。solar=公历（阳历），lunar=农历（阴历）。AI 应根据用户表述推断：提到\'农历\'/\'阴历\'/\'正月\'等选 lunar，默认 solar。支持中文别名（\'公历\'/\'农历\'）。',
  ),
  date: z.string().regex(/^\d{4}-\d{1,2}-\d{1,2}$/, '日期格式必须为 YYYY-M-D').describe(DATE_DESCRIPTION),
  isLeapMonth: z.boolean().optional().default(false)
    .describe('是否为农历闰月。仅 dateType="lunar" 时有效，默认 false。'),
  language: LanguageSchema.optional().default('zh-CN'),
});

type GetSignInput = z.infer<typeof GetSignInputSchema>;

/**
 * get_sign Tool — 根据日期获取西方星座
 *
 * 支持公历和农历两种输入方式。轻量级独立查询。
 */
export const getSignTool = {
  name: 'get_sign' as const,
  description: '根据日期获取西方星座（黄道十二宫）。支持公历和农历两种日期输入，支持多语言输出。',
  inputSchema: GetSignInputSchema,
  handler: async (input: GetSignInput) => {
    try {
      input = applyParamAliases(input) as typeof input;
      applyEnumAliases(input, 'dateType', DATE_TYPE_ALIASES);
      let sign: string;

      if (input.dateType === 'solar') {
        sign = astro.getSignBySolarDate(input.date, input.language);
      } else {
        sign = astro.getSignByLunarDate(input.date, input.isLeapMonth, input.language);
      }

      const result = { sign, date: input.date };

      return { content: [{ type: 'text' as const, text: toJSON(result) }] };
    } catch (error: unknown) {
      return handleError(error, 'get_sign');
    }
  },
};
