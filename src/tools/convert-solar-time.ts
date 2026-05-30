import { z } from 'zod';

import { SolarTimeSchema } from '../schemas/location.js';
import { convertToApparentSolarTime } from '../utils/solar-time.js';
import { toJSON } from '../utils/format.js';
import { handleError } from '../utils/errors.js';

type SolarTimeInput = z.infer<typeof SolarTimeSchema>;

/**
 * convert_solar_time Tool — 将北京时间转换为真太阳时
 *
 * 基于 Jean Meeus 天文算法，根据观测地经度将北京时间修正为地方真太阳时。
 * 计算过程：北京时间 → 地方平太阳时（经度修正）→ 真太阳时（均时差叠加）。
 */
export const convertSolarTimeTool = {
  name: 'convert_solar_time' as const,
  description: '将北京时间根据经纬度转换为真太阳时（Jean Meeus天文算法）',
  inputSchema: SolarTimeSchema,
  handler: async (input: SolarTimeInput) => {
    try {
      const apparentSolarTime = convertToApparentSolarTime(
        input.beijingTime,
        input.longitude,
        input.latitude,
      );
      const result = {
        beijing_time: input.beijingTime,
        longitude: input.longitude,
        latitude: input.latitude,
        apparent_solar_time: apparentSolarTime,
      };
      return { content: [{ type: 'text' as const, text: toJSON(result) }] };
    } catch (error: unknown) {
      return handleError(error, 'convert_solar_time');
    }
  },
};
