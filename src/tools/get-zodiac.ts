import { z } from 'zod';
import { astro } from 'iztro';

import { LanguageSchema } from '../schemas/common.js';
import { toJSON } from '../utils/format.js';
import { handleError } from '../utils/errors.js';

const GetZodiacInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{1,2}-\d{1,2}$/, '日期格式必须为 YYYY-M-D'),
  language: LanguageSchema.optional().default('zh-CN'),
});

type GetZodiacInput = z.infer<typeof GetZodiacInputSchema>;

/**
 * get_zodiac Tool — 根据公历日期获取生肖
 *
 * 轻量级独立查询，不需要先创建星盘。
 */
export const getZodiacTool = {
  name: 'get_zodiac' as const,
  description: '根据公历日期获取对应的十二生肖。支持多语言输出。',
  inputSchema: GetZodiacInputSchema,
  handler: async (input: GetZodiacInput) => {
    try {
      const zodiac = astro.getZodiacBySolarDate(input.date, input.language);
      const result = { zodiac, date: input.date };

      return { content: [{ type: 'text' as const, text: toJSON(result) }] };
    } catch (error: unknown) {
      return handleError(error, 'get_zodiac');
    }
  },
};
