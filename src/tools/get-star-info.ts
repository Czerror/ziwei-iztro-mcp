import { z } from 'zod';

import { createAstrolabe } from '../adapters/astro.js';
import type { IAstrolabeInstance, IPalaceInstance, IStarInstance } from '../adapters/astro.js';
import { ReconstructionKeySchema } from '../schemas/common.js';
import { formatPalaceResponse, formatStarResponse, toJSON } from '../utils/format.js';
import { handleError } from '../utils/errors.js';

const GetStarInfoInputSchema = z.object({
  reconstructionKey: ReconstructionKeySchema,
  starName: z.string().min(1, '星耀名称不能为空'),
});

type GetStarInfoInput = z.infer<typeof GetStarInfoInputSchema>;

/**
 * 在星盘的所有宫位中查找指定星耀
 */
function findStarInPalaces(
  astrolabe: IAstrolabeInstance,
  starName: string,
): { star: IStarInstance; palace: IPalaceInstance } | null {
  for (const palace of astrolabe.palaces) {
    const allStars = [...palace.majorStars, ...palace.minorStars, ...palace.adjectiveStars];
    const found = allStars.find((s) => s.name === starName);

    if (found) {
      return { star: found, palace };
    }
  }

  return null;
}

/** 三方四正宫位名称 */
interface SurroundedPalaceNames {
  target: string;
  opposite: string;
  wealth: string;
  career: string;
}

/**
 * 计算指定宫位索引的三方四正宫位名称
 */
function getSurroundedPalaceNames(astrolabe: IAstrolabeInstance, index: number): SurroundedPalaceNames {
  const oppositeIndex = (index + 6) % 12;
  const wealthIndex = (index + 4) % 12;
  const careerIndex = (index + 8) % 12;

  return {
    target: astrolabe.palaces[index]?.name ?? '',
    opposite: astrolabe.palaces[oppositeIndex]?.name ?? '',
    wealth: astrolabe.palaces[wealthIndex]?.name ?? '',
    career: astrolabe.palaces[careerIndex]?.name ?? '',
  };
}

/**
 * get_star_info Tool — 查询星耀在星盘中的详细信息
 *
 * 通过 reconstructionKey 重建星盘，遍历宫位查找指定星耀，
 * 返回星耀详情、所在宫位及三方四正宫位。
 */
export const getStarInfoTool = {
  name: 'get_star_info' as const,
  description:
    '获取指定星耀在星盘中的详细信息（亮度、四化、所在宫位、三方四正）。reconstructionKey 从 get_astrolabe 响应中直接获取。',
  inputSchema: GetStarInfoInputSchema,
  handler: async (input: GetStarInfoInput) => {
    try {
      const { reconstructionKey, starName } = input;
      const astrolabe = createAstrolabe({
        ...reconstructionKey,
        fixLeap: true,
        astroType: 'heaven',
      });
      const found = findStarInPalaces(astrolabe, starName);

      if (!found) {
        return {
          content: [
            {
              type: 'text' as const,
              text: toJSON({ error: 'NOT_FOUND', message: `未找到星耀: ${starName}` }),
            },
          ],
          isError: true,
        };
      }

      const result = {
        ...formatStarResponse(found.star),
        palace: formatPalaceResponse(found.palace),
        surroundedPalaces: getSurroundedPalaceNames(astrolabe, found.palace.index),
      };

      return { content: [{ type: 'text' as const, text: toJSON(result) }] };
    } catch (error: unknown) {
      return handleError(error, 'get_star_info');
    }
  },
};
