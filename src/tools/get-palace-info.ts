import { z } from 'zod';

import { createAstrolabe } from '../adapters/astro.js';
import { getPalaceInfo } from '../adapters/palace.js';
import { ReconstructionKeySchema } from '../schemas/common.js';
import { PalaceQuerySchema } from '../schemas/palace.js';
import { formatPalaceResponse, toJSON } from '../utils/format.js';
import { handleError } from '../utils/errors.js';

const GetPalaceInfoInputSchema = z.object({
  reconstructionKey: ReconstructionKeySchema,
  palace: PalaceQuerySchema,
});

type GetPalaceInfoInput = z.infer<typeof GetPalaceInfoInputSchema>;

/**
 * get_palace_info Tool — 获取星盘中指定宫位的完整信息
 *
 * 通过 reconstructionKey（从 get_astrolabe 响应中获取）重建星盘，
 * 查询宫位详情，包括星耀、四化、天干地支等。
 */
export const getPalaceInfoTool = {
  name: 'get_palace_info' as const,
  description:
    '获取星盘中指定宫位的详细信息（主星、辅星、杂耀、四化、天干地支、长生十二神等）。reconstructionKey 从 get_astrolabe 响应中直接获取。',
  inputSchema: GetPalaceInfoInputSchema,
  handler: async (input: GetPalaceInfoInput) => {
    try {
      const { reconstructionKey, palace: palaceQuery } = input;
      const astrolabe = createAstrolabe({
        ...reconstructionKey,
        fixLeap: true,
        astroType: 'heaven',
      });
      const palace = getPalaceInfo(astrolabe, palaceQuery);

      if (!palace) {
        return {
          content: [
            {
              type: 'text' as const,
              text: toJSON({ error: 'NOT_FOUND', message: `未找到宫位: ${palaceQuery}` }),
            },
          ],
          isError: true,
        };
      }

      const formatted = formatPalaceResponse(palace);
      const result = {
        ...formatted,
        suggestedTools: {
          patterns: {
            tool: 'get_patterns',
            description: '检测此星盘的41种紫微斗数格局，需要 reconstructionKey',
            requiredParams: ['reconstructionKey'],
          },
          hemingStar: {
            tool: 'get_heming_star',
            description: '查询特定十四主星在夫妻宫的断语，需要 starName',
            requiredParams: ['starName'],
          },
          synastry: {
            tool: 'get_synastry',
            description: '对两人进行合盘分析，需先获取另一人的 reconstructionKey 后调用',
            requiredParams: ['reconstructionKeyA', 'reconstructionKeyB'],
          },
        },
      };
      return { content: [{ type: 'text' as const, text: toJSON(result) }] };
    } catch (error: unknown) {
      return handleError(error, 'get_palace_info');
    }
  },
};
