import { z } from 'zod';

import { createAstrolabe } from '../adapters/astro.js';
import type { IAstrolabeInstance } from '../adapters/astro.js';
import { ReconstructionKeySchema } from '../schemas/common.js';
import { PalaceQuerySchema } from '../schemas/palace.js';
import { formatPalaceResponse, toJSON } from '../utils/format.js';
import { handleError } from '../utils/errors.js';

const GetSurroundedPalacesInputSchema = z.object({
  reconstructionKey: ReconstructionKeySchema,
  palace: PalaceQuerySchema,
});

type GetSurroundedPalacesInput = z.infer<typeof GetSurroundedPalacesInputSchema>;

/**
 * 计算三方四正宫位索引
 */
function getSurroundedIndices(index: number): {
  target: number;
  opposite: number;
  wealth: number;
  career: number;
} {
  return {
    target: index,
    opposite: (index + 6) % 12,
    wealth: (index + 4) % 12,
    career: (index + 8) % 12,
  };
}

/**
 * 解析宫位查询字符串为索引
 * 支持宫位名称（如 "命宫"）或纯数字字符串（如 "3"）
 */
function resolvePalaceIndex(astrolabe: IAstrolabeInstance, query: string): number {
  const numericIndex = Number(query);
  if (!Number.isNaN(numericIndex) && Number.isInteger(numericIndex) && numericIndex >= 0 && numericIndex <= 11) {
    return numericIndex;
  }

  const palace = astrolabe.palaces.find((p) => p.name === query);

  if (!palace) {
    throw new Error(`未找到宫位: ${query}`);
  }

  return palace.index;
}

/**
 * get_surrounded_palaces Tool — 获取三方四正宫位
 *
 * 通过 reconstructionKey 重建星盘，计算指定宫位的三方四正
 * （本宫 + 对宫 + 财帛位 + 官禄位）的完整宫位数据。
 */
export const getSurroundedPalacesTool = {
  name: 'get_surrounded_palaces' as const,
  description:
    '获取指定宫位的三方四正宫位数据（本宫、对宫、财帛位、官禄位），每个宫位包含完整的星耀和四化信息。reconstructionKey 从 get_astrolabe 响应中直接获取。',
  inputSchema: GetSurroundedPalacesInputSchema,
  handler: async (input: GetSurroundedPalacesInput) => {
    try {
      const { reconstructionKey, palace: palaceQuery } = input;
      const astrolabe = createAstrolabe({
        ...reconstructionKey,
        fixLeap: true,
        language: 'zh-CN',
        astroType: 'heaven',
      });
      const index = resolvePalaceIndex(astrolabe, palaceQuery);
      const indices = getSurroundedIndices(index);

      const result = {
        target: formatPalaceResponse(astrolabe.palaces[indices.target]),
        opposite: formatPalaceResponse(astrolabe.palaces[indices.opposite]),
        wealth: formatPalaceResponse(astrolabe.palaces[indices.wealth]),
        career: formatPalaceResponse(astrolabe.palaces[indices.career]),
      };

      return { content: [{ type: 'text' as const, text: toJSON(result) }] };
    } catch (error: unknown) {
      return handleError(error, 'get_surrounded_palaces');
    }
  },
};
