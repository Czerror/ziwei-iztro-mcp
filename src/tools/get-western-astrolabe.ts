/**
 * get_western_astrolabe Tool
 *
 * 西方占星本命星盘生成 Tool。
 * 根据出生时间和地理坐标生成西方占星本命星盘，
 * 包含行星位置、四轴点、十二宫头、主要相位和星盘摘要。
 */
import { z } from 'zod';

import { generateWesternAstrolabe } from '../adapters/celestine.js';
import { WesternAstrolabeOptionsSchema } from '../schemas/western-astrolabe.js';
import type { WesternAstrolabeOptions } from '../schemas/western-astrolabe.js';
import { toJSON } from '../utils/format.js';
import { handleError } from '../utils/errors.js';
import {
  applyParamAliases,
  applyEnumAliases,
  GENDER_ALIASES,
} from '../utils/aliases.js';

type AstrolabeInput = z.infer<typeof WesternAstrolabeOptionsSchema>;

/**
 * get_western_astrolabe Tool
 *
 * 生成西方占星本命星盘，包含：
 * - 行星位置（太阳/月亮/水星/金星/火星/木星/土星/天王星/海王星/冥王星）
 * - 四轴点（上升/下降/天顶/天底）
 * - 十二宫头位置
 * - 主要相位（合相/六合/刑相/拱相/冲相）
 * - 星盘摘要（元素分布/模态分布/逆行行星/格局模式）
 *
 * 建议后续调用 get_western_scope 进行行运分析。
 */
export const getWesternAstrolabeTool = {
  name: 'get_western_astrolabe' as const,
  description:
    '生成西方占星本命星盘（出生盘），包含10大行星位置、四轴点（上升/下降/天顶/天底）、' +
    '十二宫头、主要相位（合相/六合/刑相/拱相/冲相）及星盘摘要（元素/模式/逆行/格局分布）。' +
    '\n\n输入参数：' +
    '\n- year/month/day: 出生年月日（公历）' +
    '\n- hour/minute: 出生时间（24小时制）' +
    '\n- latitude/longitude: 出生地经纬度（北纬/东经为正）' +
    '\n- timezone: 时区偏移（默认8，即北京时间）' +
    '\n- houseSystem: 宫位系统（默认P=Placidus）' +
    '\n- language: 输出语言（默认zh-CN）' +
    '\n\n建议后续调用 get_western_scope 进行行运分析。',
  inputSchema: WesternAstrolabeOptionsSchema,
  handler: async (input: AstrolabeInput) => {
    try {
      const mapped = applyParamAliases(input as unknown as Record<string, unknown>) as unknown as AstrolabeInput;
      applyEnumAliases(mapped as unknown as Record<string, unknown>, 'gender', GENDER_ALIASES);

      const result = generateWesternAstrolabe(mapped as WesternAstrolabeOptions);

      return {
        content: [
          {
            type: 'text' as const,
            text: toJSON({
              result,
              suggestedTools: ['get_western_scope'],
            }),
          },
        ],
      };
    } catch (error: unknown) {
      return handleError(error, 'get_western_astrolabe');
    }
  },
};
