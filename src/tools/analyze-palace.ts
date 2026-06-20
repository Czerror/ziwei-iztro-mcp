import { z } from 'zod';

import { createAstrolabe } from '../adapters/astro.js';
import type { IAstrolabeInstance, IPalaceInstance } from '../adapters/astro.js';
import { getPalaceInfo } from '../adapters/palace.js';
import { ReconstructionKeySchema } from '../schemas/common.js';
import { PalaceQuerySchema } from '../schemas/palace.js';
import { toJSON } from '../utils/format.js';
import { handleError } from '../utils/errors.js';

const AnalyzePalaceInputSchema = z.object({
  reconstructionKey: ReconstructionKeySchema,
  palace: PalaceQuerySchema,
  hasStars: z.array(z.string()).optional()
    .describe("检查宫位中是否同时包含所有指定星耀（AND 逻辑）。星耀名如'紫微'、'左辅'等"),
  hasOneOfStars: z.array(z.string()).optional()
    .describe('检查宫位中是否包含任一指定星耀（OR 逻辑）'),
  notHaveStars: z.array(z.string()).optional()
    .describe('检查宫位中是否不包含指定星耀'),
  hasMutagen: z.string().optional()
    .describe("检查宫位中是否有指定四化。可选值：'禄'、'权'、'科'、'忌'"),
  isEmpty: z
    .object({
      excludeStars: z.array(z.string()).optional(),
    })
    .optional()
    .describe('检查宫位是否为空宫（无主星）。excludeStars 可排除特定星耀（如杂耀）'),
  fliesTo: z
    .object({
      to: PalaceQuerySchema,
      withMutagens: z.array(z.string()).min(1, 'withMutagens 不能为空数组'),
    })
    .optional()
    .describe('检查是否有星耀的四化飞入指定宫位。to=目标宫位名，withMutagens=四化类型列表'),
  selfMutaged: z.array(z.string()).min(1, 'selfMutaged 不能为空数组').optional()
    .describe("检查宫位内是否有星耀自化。传入四化类型列表，如['禄','忌']"),
  getMutagedPlaces: z.boolean().optional()
    .describe('若为 true，返回当前宫位星耀的四化飞入目标宫位列表'),
});

type AnalyzePalaceInput = z.infer<typeof AnalyzePalaceInputSchema>;

/** 带分析方法的扩展宫位类型 */
interface IExtendedPalace extends IPalaceInstance {
  has(stars: string[]): boolean;
  hasOneOf(stars: string[]): boolean;
  notHave(stars: string[]): boolean;
  hasMutagen(mutagen: string): boolean;
  isEmpty(excludeStars?: string[]): boolean;
  fliesTo(to: string | number, withMutagens: string | string[]): boolean;
  selfMutaged(withMutagens: string | string[]): boolean;
  mutagedPlaces(): IExtendedPalace[];
  setAstrolabe(astrolabe: IAstrolabeInstance): void;
}

/**
 * analyze_palace Tool — 综合宫位分析
 *
 * 通过 reconstructionKey 重建星盘，对指定宫位进行多维度分析：
 * 星耀存在性判断、四化情况、空宫判断、飞化关系、自化分析、四化飞入宫位查询。
 */
export const analyzePalaceTool = {
  name: 'analyze_palace' as const,
  description:
    '对指定宫位进行综合分析（星耀存在性、四化、空宫、飞化、自化）。reconstructionKey 必须从 get_astrolabe 响应中直接复制，不要手动构造或修改其内容。',
  inputSchema: AnalyzePalaceInputSchema,
  handler: async (input: AnalyzePalaceInput) => {
    try {
      const { reconstructionKey, palace: palaceQuery } = input;
      const astrolabe = createAstrolabe({
        ...reconstructionKey,
        fixLeap: true,
        astroType: 'heaven',
        useSolarTime: false,
      });
      const palace = getPalaceInfo(astrolabe, palaceQuery) as IExtendedPalace | undefined;

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

      palace.setAstrolabe(astrolabe);

      const result: Record<string, unknown> = {
        palace: {
          name: palace.name,
          index: palace.index,
          heavenlyStem: palace.heavenlyStem,
          earthlyBranch: palace.earthlyBranch,
          isBodyPalace: palace.isBodyPalace,
          isOriginalPalace: palace.isOriginalPalace,
        },
      };
      const checks: Record<string, boolean> = {};

      if (input.hasStars !== undefined) {
        checks.hasStars = palace.has(input.hasStars);
      }

      if (input.hasOneOfStars !== undefined) {
        checks.hasOneOfStars = palace.hasOneOf(input.hasOneOfStars);
      }

      if (input.notHaveStars !== undefined) {
        checks.notHaveStars = palace.notHave(input.notHaveStars);
      }

      if (input.hasMutagen !== undefined) {
        checks.hasMutagen = palace.hasMutagen(input.hasMutagen);
      }

      if (input.isEmpty !== undefined) {
        checks.isEmpty = palace.isEmpty(input.isEmpty.excludeStars);
      }

      if (input.fliesTo !== undefined) {
        checks.fliesTo = palace.fliesTo(input.fliesTo.to, input.fliesTo.withMutagens);
      }

      if (input.selfMutaged !== undefined) {
        checks.selfMutaged = palace.selfMutaged(input.selfMutaged);
      }

      if (Object.keys(checks).length > 0) {
        result.checks = checks;
      }

      if (input.getMutagedPlaces) {
        const places = palace.mutagedPlaces();
        result.mutagedPlaces = places.map((p) => p.name);
      }

      return { content: [{ type: 'text' as const, text: toJSON(result) }] };
    } catch (error: unknown) {
      return handleError(error, 'analyze_palace');
    }
  },
};
