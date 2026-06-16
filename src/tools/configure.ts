import { z } from 'zod';
import { astro } from 'iztro';

import { toJSON } from '../utils/format.js';
import { handleError } from '../utils/errors.js';

const GROUPS_DIVIDE_OPTIONS = ['normal', 'exact'] as const;
const AGE_DIVIDE_OPTIONS = ['normal', 'birthday'] as const;
const DAY_DIVIDE_OPTIONS = ['current', 'forward'] as const;
const ALGORITHM_OPTIONS = ['default', 'zhongzhou'] as const;

const ConfigureInputSchema = z.object({
  mutagens: z.record(z.string(), z.array(z.string())).optional(),
  brightness: z.record(z.string(), z.array(z.string())).optional(),
  yearDivide: z.enum(GROUPS_DIVIDE_OPTIONS).optional(),
  horoscopeDivide: z.enum(GROUPS_DIVIDE_OPTIONS).optional(),
  ageDivide: z.enum(AGE_DIVIDE_OPTIONS).optional(),
  dayDivide: z.enum(DAY_DIVIDE_OPTIONS).optional(),
  algorithm: z.enum(ALGORITHM_OPTIONS).optional(),
  useSolarTime: z
    .boolean()
    .optional()
    .describe(
      '是否默认启用真太阳时修正。当用户未在每个请求中明确指定时，使用此默认值。默认为 false（不启用修正）',
    ),
  reset: z.boolean().optional().default(false),
});

type ConfigureInput = z.infer<typeof ConfigureInputSchema>;

/** 默认配置值 */
const DEFAULT_CONFIG = {
  yearDivide: 'normal' as const,
  horoscopeDivide: 'normal' as const,
  ageDivide: 'normal' as const,
  dayDivide: 'forward' as const,
  algorithm: 'default' as const,
  useSolarTime: false,
} as const;

/**
 * configure Tool — 配置服务器全局参数
 *
 * 设置 iztro 的全局配置（四化、亮度、年分界点等），影响后续所有星盘创建的行为。
 * 支持部分更新和重置到默认值。
 */
export const configureTool = {
  name: 'configure' as const,
  description:
    '配置服务器全局参数，包括四化规则、星耀亮度、年分界点、运限分界点、小限分界点、晚子时处理方式、安星算法和真太阳时默认开关。修改后影响后续所有 Tool 调用。',
  inputSchema: ConfigureInputSchema,
  handler: async (input: ConfigureInput) => {
    try {
      const {
        mutagens,
        brightness,
        yearDivide,
        horoscopeDivide,
        ageDivide,
        dayDivide,
        algorithm,
        useSolarTime,
        reset,
      } = input;

      if (reset) {
        astro.config(DEFAULT_CONFIG);
        const currentConfig = astro.getConfig();
        const result = {
          currentConfig: {
            mutagens: currentConfig.mutagens,
            brightness: currentConfig.brightness,
            yearDivide: currentConfig.yearDivide,
            horoscopeDivide: currentConfig.horoscopeDivide,
            ageDivide: currentConfig.ageDivide,
            dayDivide: currentConfig.dayDivide,
            algorithm: currentConfig.algorithm,
            useSolarTime: DEFAULT_CONFIG.useSolarTime,
          },
          message: '配置已重置为默认值',
        };

        return { content: [{ type: 'text' as const, text: toJSON(result) }] };
      }

      astro.config({
        mutagens,
        brightness,
        yearDivide,
        horoscopeDivide,
        ageDivide,
        dayDivide,
        algorithm,
      });

      const currentConfig = astro.getConfig();
      const result = {
        currentConfig: {
          mutagens: currentConfig.mutagens,
          brightness: currentConfig.brightness,
          yearDivide: currentConfig.yearDivide,
          horoscopeDivide: currentConfig.horoscopeDivide,
          ageDivide: currentConfig.ageDivide,
          dayDivide: currentConfig.dayDivide,
          algorithm: currentConfig.algorithm,
          useSolarTime: useSolarTime ?? DEFAULT_CONFIG.useSolarTime,
        },
        message: '配置已更新',
      };

      return { content: [{ type: 'text' as const, text: toJSON(result) }] };
    } catch (error: unknown) {
      return handleError(error, 'configure');
    }
  },
};
