import { z } from 'zod';

import { createAstrolabe } from '../adapters/astro.js';
import { AstrolabeOptionsSchema } from '../schemas/astro.js';
import { convertToSolarTime } from '../utils/solar-time.js';
import { formatAstrolabeResponse, toJSON } from '../utils/format.js';
import { handleError } from '../utils/errors.js';
import { applyParamAliases, applyEnumAliases, GENDER_ALIASES, DATE_TYPE_ALIASES, ASTRO_TYPE_ALIASES } from '../utils/aliases.js';

/**
 * 时辰索引 → 对应的小时（取双时辰起点，用于真太阳时计算）
 * timeIndex 0 (子时 23:00-00:59) → 23:00, timeIndex 1 (丑时) → 01:00, ...
 * timeIndex 12 视为晚子时 → 23:00
 */
function timeIndexToHour(timeIndex: number): number {
  if (timeIndex === 0 || timeIndex === 12) {
    return 23;
  }
  return ((timeIndex * 2 - 1) + 24) % 24;
}

/**
 * 小时 → 时辰索引
 * 23:00-00:59 → 0 (子时), 01:00-02:59 → 1 (丑时), ...
 */
function hourToTimeIndex(hour: number): number {
  return Math.floor(((hour + 1) % 24) / 2);
}

/**
 * 将 "YYYY-M-D" 格式补零为 "YYYY-MM-DD"
 */
function padDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

/**
 * 根据日期和时辰索引构建北京时间字符串 (YYYY-MM-DD HH:mm:ss)
 * 用于没有精确时间时的近似计算（取时辰起点）
 */
function buildBeijingTime(date: string, timeIndex: number): string {
  const paddedDate = padDate(date);
  const hour = timeIndexToHour(timeIndex);
  const wholeHour = Math.floor(hour);
  return `${paddedDate} ${String(wholeHour).padStart(2, '0')}:00:00`;
}

/**
 * 构建精确的北京时间字符串，优先使用用户提供的精确时间
 * 用于真太阳时计算，精度影响可忽略但仍应尽量精确
 */
function buildPreciseBeijingTime(date: string, time?: string, hour?: number, timeIndex?: number): string {
  const paddedDate = padDate(date);
  if (time !== undefined) {
    return `${paddedDate} ${time}:00`;
  }
  if (hour !== undefined) {
    return `${paddedDate} ${String(hour).padStart(2, '0')}:00:00`;
  }
  return buildBeijingTime(date, timeIndex ?? 0);
}

/**
 * get_astrolabe Tool — 根据出生日期和时间创建紫微斗数星盘
 *
 * 这是所有后续查询的基础 Tool。返回完整星盘数据，
 * 附加原始 timeIndex 供下游 Tool 重建星盘实例。
 *
 * 当 useSolarTime 为 true 且提供 longitude 参数时，会使用 Meeus 天文算法
 * 将北京时间转换为出生地真太阳时，并据此调整时辰索引。无需外部 API。
 * AI 可根据用户提供的城市名自行推断经纬度（如北京≈116.4, 上海≈121.5）。
 */
export const getAstrolabeTool = {
  name: 'get_astrolabe' as const,
  description:
    '根据出生日期和时间创建紫微斗数星盘。支持公历(solar)和农历(lunar)两种日期类型。' +
    '可选提供出生地经度(longitude)和纬度(latitude)。当 useSolarTime 设为 true 时，将使用Meeus天文算法校正真太阳时。' +
    'AI可自行根据城市名推断经纬度，无需调用外部API。返回包含十二宫完整信息的星盘数据。' +
    '\n\n示例调用：\n{\n  "dateType": "solar",\n  "date": "1990-05-20",\n  "time": "09:15",\n  "gender": "male",\n  "longitude": 116.4\n}',
  inputSchema: AstrolabeOptionsSchema,
  handler: async (input: z.infer<typeof AstrolabeOptionsSchema>) => {
    try {
      input = applyParamAliases(input) as typeof input;
      applyEnumAliases(input, 'gender', GENDER_ALIASES);
      applyEnumAliases(input, 'dateType', DATE_TYPE_ALIASES);
      applyEnumAliases(input, 'astroType', ASTRO_TYPE_ALIASES);
      if (typeof input.date === 'string' && input.date.includes(' ')) {
        const [datePart, timePart] = input.date.split(' ');
        input.date = datePart;
        if (input.time === undefined && /^\d{1,2}:\d{2}$/.test(timePart)) {
          input.time = timePart;
        }
      }
      const { longitude, date, hour, time } = input;
      // 优先级: timeIndex > time(字符串) > hour，MCP 内部自动换算
      const resolveTimeIndex = (): number => {
        if (time !== undefined) {
          return Math.floor(((parseInt(time.split(':')[0], 10) + 1) % 24) / 2);
        }
        if (hour !== undefined) {
          return Math.floor(((hour + 1) % 24) / 2);
        }
        return input.timeIndex;
      };
      const rawTimeIndex: number = resolveTimeIndex();
      let effectiveTimeIndex = rawTimeIndex;
      let solarTimeResult: Record<string, unknown> | null = null;

      if (longitude !== undefined && input.useSolarTime === true) {
        const beijingTime = buildPreciseBeijingTime(date, time, hour, rawTimeIndex);
        const beijingDate = new Date(beijingTime);
        const solarDate = convertToSolarTime(beijingDate, longitude, input.latitude, true);
        const solarHour = solarDate.getHours();

        // 格式化 apparentSolarTime 字符串以保持 API 响应兼容
        const apparentSolarTime = `${solarDate.getFullYear()}-${String(solarDate.getMonth() + 1).padStart(2, '0')}-${String(solarDate.getDate()).padStart(2, '0')} ${String(solarDate.getHours()).padStart(2, '0')}:${String(solarDate.getMinutes()).padStart(2, '0')}:${String(solarDate.getSeconds()).padStart(2, '0')}`;
        const solarTimeIndex = hourToTimeIndex(solarHour);

        if (solarTimeIndex !== rawTimeIndex) {
          effectiveTimeIndex = solarTimeIndex;
          solarTimeResult = {
            corrected: true,
            beijingTime,
            apparentSolarTime,
            longitude,
            originalTimeIndex: rawTimeIndex,
            adjustedTimeIndex: solarTimeIndex,
          };
        } else {
          solarTimeResult = {
            corrected: false,
            beijingTime,
            apparentSolarTime,
            longitude,
            timeIndex: rawTimeIndex,
            message: '真太阳时校正后时辰未变化，使用原始时辰',
          };
        }
      }

      const effectiveOptions = {
        ...input,
        timeIndex: effectiveTimeIndex,
      };
      const astrolabe = createAstrolabe(effectiveOptions);
      const formatted = formatAstrolabeResponse(astrolabe);

      const reconstructionKey = {
        dateType: input.dateType,
        date: input.date,
        timeIndex: effectiveTimeIndex,
        gender: input.gender,
        isLeapMonth: input.isLeapMonth ?? false,
      };
      const result: Record<string, unknown> = {
        ...formatted,
        reconstructionKey,
        timeIndex: rawTimeIndex,
        ...(solarTimeResult && { solarTime: solarTimeResult }),
        suggestedTools: {
          patterns: {
            tool: 'get_patterns',
            description: '检测此星盘的41种紫微斗数格局（君臣庆会、杀破狼、机月同梁等），需要 reconstructionKey',
            requiredParams: ['reconstructionKey'],
          },
          hemingStar: {
            tool: 'get_heming_star',
            description: '查询特定十四主星在夫妻宫的断语（配偶特征、婚期等），需要 starName',
            requiredParams: ['starName'],
          },
          synastry: {
            tool: 'get_synastry',
            description: '对两人进行合盘分析（婚姻匹配、感情配对），需先获取另一人的 reconstructionKey 后调用',
            requiredParams: ['reconstructionKeyA', 'reconstructionKeyB'],
          },
        },
      };

      // 当真太阳时跨时辰时，同时排出原时辰星盘供 AI 对比
      if (solarTimeResult?.corrected && rawTimeIndex !== effectiveTimeIndex) {
        const originalOptions = {
          ...input,
          timeIndex: rawTimeIndex,
        };
        const originalAstrolabe = createAstrolabe(originalOptions);
        const originalFormatted = formatAstrolabeResponse(originalAstrolabe);
        result.originalAstrolabe = originalFormatted;
        result.originalReconstructionKey = {
          dateType: input.dateType,
          date: input.date,
          timeIndex: rawTimeIndex,
          gender: input.gender,
          isLeapMonth: input.isLeapMonth ?? false,
        };
        result.comparisonNote =
          '真太阳时校正导致时辰变化，当前星盘使用校正后时辰。originalAstrolabe 为原始时辰星盘，可通过 originalReconstructionKey 独立查询。';
      }

      return { content: [{ type: 'text' as const, text: toJSON(result) }] };
    } catch (error: unknown) {
      return handleError(error, 'get_astrolabe');
    }
  },
};
