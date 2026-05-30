import type { IAstrolabeInstance } from './astro.js';

/**
 * 运限条目输出结构
 */
export interface HoroscopeItemOutput {
  index: number;
  name: string;
  heavenlyStem: string;
  earthlyBranch: string;
  palaceNames: string[];
  mutagen: string[];
  stars?: string[][];
}

/**
 * 运限完整输出结构
 */
export interface HoroscopeOutput {
  solarDate: string;
  lunarDate: string;
  decadal: HoroscopeItemOutput;
  age: HoroscopeItemOutput & { nominalAge: number };
  yearly: HoroscopeItemOutput & {
    yearlyDecStar: {
      jiangqian12: string[];
      suiqian12: string[];
    };
  };
  monthly: HoroscopeItemOutput;
  daily: HoroscopeItemOutput;
  hourly: HoroscopeItemOutput;
}

/**
 * 创建运限数据
 * 基于已有星盘实例，获取指定日期的运限信息
 *
 * @param astrolabe 星盘实例
 * @param targetDate 目标日期（YYYY-M-D），默认为当前日期
 * @param timeIndex 目标时辰索引 0-12
 * @returns 运限完整数据
 */
export function createHoroscope(
  astrolabe: IAstrolabeInstance,
  targetDate?: string,
  timeIndex?: number,
): HoroscopeOutput {
  const raw = astrolabe.horoscope(targetDate, timeIndex) as HoroscopeOutput;
  return raw;
}
