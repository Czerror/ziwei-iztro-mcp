import { astro } from 'iztro';
import type { AstrolabeOptions } from '../schemas/astro.js';

/**
 * 星耀实例的最小接口（用于适配层与 iztro FunctionalStar 交互）
 */
export interface IStarInstance {
  name: string;
  type: string;
  scope: string;
  brightness?: string;
  mutagen?: string;
}

/**
 * 宫位实例的最小接口（用于适配层与 iztro FunctionalPalace 交互）
 */
export interface IPalaceInstance {
  index: number;
  name: string;
  isBodyPalace: boolean;
  isOriginalPalace: boolean;
  heavenlyStem: string;
  earthlyBranch: string;
  majorStars: IStarInstance[];
  minorStars: IStarInstance[];
  adjectiveStars: IStarInstance[];
  changsheng12: string;
  boshi12: string;
  jiangqian12: string;
  suiqian12: string;
  decadal: { range: [number, number]; heavenlyStem: string; earthlyBranch: string };
  ages: number[];
}

/**
 * 星盘实例的最小接口（用于适配层与 iztro FunctionalAstrolabe 交互）
 */
export interface IAstrolabeInstance {
  gender: string;
  solarDate: string;
  lunarDate: string;
  chineseDate: string;
  time: string;
  timeRange: string;
  sign: string;
  zodiac: string;
  earthlyBranchOfSoulPalace: string;
  earthlyBranchOfBodyPalace: string;
  soul: string;
  body: string;
  fiveElementsClass: string;
  copyright: string;
  palaces: IPalaceInstance[];
  horoscope(targetDate?: string, timeIndex?: number): unknown;
  palace(indexOrName: string | number): IPalaceInstance | undefined;
}

/**
 * 创建紫微斗数星盘
 * 根据日期类型分发到 bySolar 或 byLunar，并处理天地人盘切换
 *
 * @param options 星盘创建选项（经过 Zod 验证）
 * @returns iztro FunctionalAstrolabe 实例
 */
export function createAstrolabe(options: AstrolabeOptions): IAstrolabeInstance {
  const {
    dateType,
    date,
    timeIndex,
    gender,
    isLeapMonth = false,
    fixLeap = true,
    language,
    astroType = 'heaven',
    config: cfg,
  } = options;

  if (cfg) {
    astro.config(cfg);
  }

  if (astroType !== 'heaven') {
    return astro.withOptions({
      type: dateType,
      dateStr: date,
      timeIndex,
      gender: gender as 'male' | 'female',
      isLeapMonth,
      fixLeap,
      language,
      astroType,
      config: cfg,
    }) as unknown as IAstrolabeInstance;
  }

  if (dateType === 'solar') {
    return astro.bySolar(date, timeIndex, gender as 'male' | 'female', fixLeap, language) as unknown as IAstrolabeInstance;
  }

  return astro.byLunar(
    date,
    timeIndex,
    gender as 'male' | 'female',
    isLeapMonth,
    fixLeap,
    language,
  ) as unknown as IAstrolabeInstance;
}
