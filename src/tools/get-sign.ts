import { z } from 'zod';
import { astro } from 'iztro';

import { LanguageSchema } from '../schemas/common.js';
import { toJSON } from '../utils/format.js';
import { handleError } from '../utils/errors.js';

const GetSignInputSchema = z.object({
  dateType: z.enum(['solar', 'lunar']),
  date: z.string().regex(/^\d{4}-\d{1,2}-\d{1,2}$/, '日期格式必须为 YYYY-M-D'),
  isLeapMonth: z.boolean().optional().default(false),
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
