import { z } from 'zod';

import {
  STAR_IN_FUQI_GU,
  STAR_IN_MING_GU,
  STAR_IN_CAI_BO_GU,
  STAR_IN_GUAN_LU_GU,
  STAR_IN_FU_DE_GU,
  type StarPalacePhrase,
} from '../resources/heming-knowledge.js';
import { PalaceStarQuerySchema } from '../schemas/heming.js';
import { toJSON } from '../utils/format.js';
import { handleError } from '../utils/errors.js';

const PALACE_DATA: Record<string, Record<string, StarPalacePhrase>> = {
  fuqi: STAR_IN_FUQI_GU,
  ming: STAR_IN_MING_GU,
  caibo: STAR_IN_CAI_BO_GU,
  guanlu: STAR_IN_GUAN_LU_GU,
  fude: STAR_IN_FU_DE_GU,
};

const PALACE_LABELS: Record<string, string> = {
  fuqi: '夫妻宫',
  ming: '命宫',
  caibo: '财帛宫',
  guanlu: '官禄宫',
  fude: '福德宫',
};

/**
 * get_star_in_palace Tool — 查询十四主星在指定宫位的倪海夏断语
 *
 * 根据十四主星名称和宫位类型，返回该星耀在对应宫位的完整断语。
 * 夫妻宫额外包含配偶外形性格(spouseTraits)和婚期建议(timing)。
 * 此工具不依赖具体星盘，仅返回知识库中的标准断语。
 */
export const getHemingStarTool = {
  name: 'get_star_in_palace' as const,
  description:
    '查询十四主星在指定宫位（夫妻宫/命宫/财帛宫/官禄宫/福德宫）的倪海夏断语。\n\n' +
    '不需要星盘，可直接查询。覆盖全部14主星×5宫位。\n' +
    '统一返回：核心总结(summary)、吉象条件(good)、凶象注意事项(bad)、倪海夏原话(niQuote?)。\n' +
    '夫妻宫额外包含：配偶外形性格(spouseTraits?)、婚期建议(timing?)。\n' +
    '相关资源：\n' +
    '- iztro://heming/stars-in-fuqi-gu（夫妻宫断语）\n' +
    '- iztro://palace/ming-gong-stars（命宫断语）\n' +
    '- iztro://palace/caibo-gong-stars（财帛宫断语）\n' +
    '- iztro://palace/guanlu-gong-stars（官禄宫断语）\n' +
    '- iztro://palace/fude-gong-stars（福德宫断语）',
  inputSchema: PalaceStarQuerySchema,
  handler: async (input: z.infer<typeof PalaceStarQuerySchema>) => {
    try {
      const { starName, palaceType } = input;
      const dataMap = PALACE_DATA[palaceType];
      const phrase = dataMap?.[starName] ?? null;

      if (!phrase) {
        return {
          content: [
            {
              type: 'text' as const,
              text: toJSON({
                error: 'NOT_FOUND',
                message: `未找到主星 "${starName}" 在${PALACE_LABELS[palaceType] ?? palaceType}的断语数据`,
              }),
            },
          ],
          isError: true,
        };
      }

      const result = {
        starName,
        palaceType,
        palaceLabel: PALACE_LABELS[palaceType] ?? palaceType,
        phrase,
      };

      return { content: [{ type: 'text' as const, text: toJSON(result) }] };
    } catch (error: unknown) {
      return handleError(error, 'get_star_in_palace');
    }
  },
};
