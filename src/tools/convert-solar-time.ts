import { z } from 'zod';

import { SolarTimeSchema } from '../schemas/location.js';
import { convertToSolarTime, parseTimeInput } from '../utils/solar-time.js';
import { toJSON } from '../utils/format.js';
import { handleError } from '../utils/errors.js';

type SolarTimeInput = z.infer<typeof SolarTimeSchema>;

/**
 * convert_solar_time Tool — 将北京时间转换为真太阳时
 *
 * 支持三种时间输入格式：
 * 1. 具体时间（14:30）— 精确到分钟
 * 2. 时间范围（13-15）— 取中间值
 * 3. 时辰（丑时）— 取中间值，不进行真太阳时修正
 *
 * 基于 Jean Meeus 天文算法，根据观测地经度将北京时间修正为地方真太阳时。
 * 可通过 useSolarTime 开关控制是否启用修正。
 */
export const convertSolarTimeTool = {
  name: 'convert_solar_time' as const,
  description:
    '将北京时间根据经纬度转换为真太阳时（Jean Meeus天文算法）。' +
    '支持时间范围输入（取中间值）和时辰输入（不进行真太阳时修正）。' +
    '通过 useSolarTime 开关控制是否启用真太阳时修正，默认不修正。',
  inputSchema: SolarTimeSchema,
  handler: async (input: SolarTimeInput) => {
    try {
      const { time, date: dateStr, longitude, latitude, useSolarTime = false } = input;

      // Step 1: 解析时间输入
      const parsed = parseTimeInput(time);

      // Step 2: 确定是否执行真太阳时修正
      // 如果输入是时辰，强制跳过修正；否则使用 useSolarTime 参数
      const shouldCorrect = useSolarTime && !parsed.skipSolarTime;

      // Step 3: 构建 Date 对象（北京时间 UTC+8）
      const dateObj = new Date(
        `${dateStr}T${String(parsed.hour).padStart(2, '0')}:${String(parsed.minute).padStart(2, '0')}:00+08:00`
      );

      // Step 4: 转换
      const solarDate = convertToSolarTime(dateObj, longitude, latitude, shouldCorrect);

      return {
        content: [{
          type: 'text' as const,
          text: toJSON({
            input: { time, date: dateStr, longitude, latitude, useSolarTime },
            parsedTime: `${String(parsed.hour).padStart(2, '0')}:${String(parsed.minute).padStart(2, '0')}`,
            isShichen: parsed.skipSolarTime,
            solarTimeApplied: shouldCorrect,
            result: solarDate.toISOString(),
            resultFormatted:
              `${String(solarDate.getHours()).padStart(2, '0')}:${String(solarDate.getMinutes()).padStart(2, '0')}:${String(solarDate.getSeconds()).padStart(2, '0')}`,
          }),
        }],
      };
    } catch (error: unknown) {
      return handleError(error, 'convert_solar_time');
    }
  },
};
