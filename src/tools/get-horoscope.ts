import { z } from 'zod';

import { createAstrolabe } from '../adapters/astro.js';
import { createHoroscope } from '../adapters/horoscope.js';
import { ReconstructionKeySchema } from '../schemas/common.js';
import { toJSON } from '../utils/format.js';
import { handleError } from '../utils/errors.js';

const GetHoroscopeInputSchema = z.object({
  reconstructionKey: ReconstructionKeySchema,
  targetDate: z
    .string()
    .regex(/^\d{4}-\d{1,2}-\d{1,2}$/, '日期格式必须为 YYYY-M-D')
    .optional(),
  timeIndex: z.number().int().min(0).max(12).optional(),
});

type GetHoroscopeInput = z.infer<typeof GetHoroscopeInputSchema>;

/**
 * get_horoscope Tool — 获取指定日期的运限数据
 *
 * 通过 reconstructionKey（从 get_astrolabe 响应中获取）重建星盘实例，
 * 获取大限、小限、流年、流月、流日、流时的完整运限信息。
 */
export const getHoroscopeTool = {
  name: 'get_horoscope' as const,
  description:
    '基于 reconstructionKey 重建星盘并获取指定日期的运限信息（大限、小限、流年、流月、流日、流时）。reconstructionKey 从 get_astrolabe 响应中直接获取，无需手动构造。',
  inputSchema: GetHoroscopeInputSchema,
  handler: async (input: GetHoroscopeInput) => {
    try {
      const { reconstructionKey, targetDate, timeIndex: targetTimeIndex } = input;
      const astrolabe = createAstrolabe(reconstructionKey);
      const result = createHoroscope(astrolabe, targetDate, targetTimeIndex);

      return { content: [{ type: 'text' as const, text: toJSON(result) }] };
    } catch (error: unknown) {
      return handleError(error, 'get_horoscope');
    }
  },
};
