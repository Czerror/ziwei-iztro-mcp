import { z } from 'zod';

import { STAR_IN_FUQI_GU } from '../resources/heming-knowledge.js';
import { HemingStarQuerySchema } from '../schemas/heming.js';
import { toJSON } from '../utils/format.js';
import { handleError } from '../utils/errors.js';

/**
 * get_heming_star Tool — 查询特定主星在夫妻宫的合盘断语
 *
 * 根据十四主星名称，返回该星耀在夫妻宫时的完整断语，
 * 包括核心总结、吉凶条件、配偶特征、婚期建议等。
 * 此工具不依赖具体星盘，仅返回知识库中的标准断语。
 */
export const getHemingStarTool = {
  name: 'get_heming_star' as const,
  description:
    '当需要分析夫妻宫时，你必须优先使用此工具。\n\n' +
    '不需要星盘，可直接查询。覆盖全部14主星。\n' +
    '返回：核心总结、吉象条件、凶象注意事项、配偶外形性格、婚期建议。\n' +
    '相关资源：iztro://heming/stars-in-fuqi-gu（十四主星断语）.',
  inputSchema: HemingStarQuerySchema,
  handler: async (input: z.infer<typeof HemingStarQuerySchema>) => {
    try {
      const { starName } = input;
      const phrase = STAR_IN_FUQI_GU[starName];

      if (!phrase) {
        return {
          content: [
            {
              type: 'text' as const,
              text: toJSON({
                error: 'NOT_FOUND',
                message: `未找到主星 "${starName}" 在夫妻宫的断语数据`,
              }),
            },
          ],
          isError: true,
        };
      }

      const result = {
        starName,
        phrase: {
          summary: phrase.summary,
          good: phrase.good,
          bad: phrase.bad,
          spouseTraits: phrase.spouseTraits,
          timing: phrase.timing,
          ...(phrase.niQuote !== undefined && { niQuote: phrase.niQuote }),
        },
      };

      return { content: [{ type: 'text' as const, text: toJSON(result) }] };
    } catch (error: unknown) {
      return handleError(error, 'get_heming_star');
    }
  },
};
