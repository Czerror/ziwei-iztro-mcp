/**
 * get_western_scope Tool
 *
 * 西方占星行运分析 Tool。
 * 基于本命盘计算指定日期的行运行星位置及与本命盘的相位关系，
 * 包含行运相位、行运落宫和本命盘精简摘要。
 * 内部自动完成本命盘计算，用户只需提供完整出生参数 + 目标日期。
 */
import { z } from 'zod';

import { generateWesternScope } from '../adapters/celestine.js';
import { WesternScopeOptionsSchema } from '../schemas/western-astrolabe.js';
import type { WesternScopeOptions } from '../schemas/western-astrolabe.js';
import { toJSON } from '../utils/format.js';
import { handleError } from '../utils/errors.js';
import {
  applyParamAliases,
  applyEnumAliases,
  GENDER_ALIASES,
} from '../utils/aliases.js';

type ScopeInput = z.infer<typeof WesternScopeOptionsSchema>;

/**
 * get_western_scope Tool
 *
 * 西方占星行运分析，计算指定时间的行运行星位置及与本命盘的相位。
 * 内部自动完成本命盘计算（无需先调用 get_western_astrolabe）。
 *
 * 输出包含：
 * - natalSummary: 本命盘精简摘要（供 AI 上下文参考）
 * - transitAspects: 行运相位列表（行运行星→本命点相位，含强度/偏差/入出相）
 * - transitHouses: 行运落宫列表（当前行运行星落入本命哪个宫位）
 * - houseRulerChain: 本命宫主星链条（定位议题落点）
 * - limitationNotice: 技术限制声明
 */
export const getWesternScopeTool = {
  name: 'get_western_scope' as const,
  description:
    '西方占星行运分析：基于本命盘计算指定日期的行运行星位置及与本命盘行星/轴点的相位关系。' +
    '内部自动完成本命盘计算，无需先调用 get_western_astrolabe。' +
    '\n\n输入参数（含完整出生参数 + 目标日期）：' +
    '\n- year/month/day/hour/minute: 出生年月日时间（公历）' +
    '\n- latitude/longitude/timezone: 出生地经纬度与时区' +
    '\n- targetYear/targetMonth/targetDay: 目标日期（公历）' +
    '\n\n输出包含行运相位（10大行运行星 × 本命12点）、行运落宫、本命宫主星链条和技术限制声明。',
  inputSchema: WesternScopeOptionsSchema,
  handler: async (input: ScopeInput) => {
    try {
      const mapped = applyParamAliases(input as unknown as Record<string, unknown>) as unknown as ScopeInput;
      applyEnumAliases(mapped as unknown as Record<string, unknown>, 'gender', GENDER_ALIASES);

      const result = generateWesternScope(mapped as WesternScopeOptions);

      return {
        content: [
          {
            type: 'text' as const,
            text: toJSON({ result }),
          },
        ],
      };
    } catch (error: unknown) {
      return handleError(error, 'get_western_scope');
    }
  },
};
