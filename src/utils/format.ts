import type { IAstrolabeInstance, IPalaceInstance, IStarInstance } from '../adapters/astro.js';

/**
 * 星耀简要输出结构
 */
export interface StarBriefOutput {
  name: string;
  type: string;
  scope: string;
  brightness?: string;
  mutagen?: string;
}

/**
 * 宫位输出结构
 */
export interface PalaceOutput {
  index: number;
  name: string;
  isBodyPalace: boolean;
  isOriginalPalace: boolean;
  heavenlyStem: string;
  earthlyBranch: string;
  majorStars: StarBriefOutput[];
  minorStars: StarBriefOutput[];
  adjectiveStars: StarBriefOutput[];
  changsheng12: string;
  boshi12: string;
  jiangqian12: string;
  suiqian12: string;
  decadal: {
    range: [number, number];
    heavenlyStem: string;
    earthlyBranch: string;
  };
  ages: number[];
}

/**
 * 星盘完整输出结构
 */
export interface AstrolabeOutput {
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
  palaces: PalaceOutput[];
}

/**
 * 格式化单个星耀为简要输出
 *
 * @param star 星耀实例
 * @returns 星耀简要数据
 */
export function formatStarResponse(star: IStarInstance): StarBriefOutput {
  return {
    name: star.name,
    type: star.type,
    scope: star.scope,
    brightness: star.brightness,
    mutagen: star.mutagen,
  };
}

/**
 * 格式化宫位实例为输出结构
 * 递归处理宫位中的所有星耀列表
 *
 * @param palace 宫位实例
 * @returns 宫位输出数据
 */
export function formatPalaceResponse(palace: IPalaceInstance): PalaceOutput {
  return {
    index: palace.index,
    name: palace.name,
    isBodyPalace: palace.isBodyPalace,
    isOriginalPalace: palace.isOriginalPalace,
    heavenlyStem: palace.heavenlyStem,
    earthlyBranch: palace.earthlyBranch,
    majorStars: palace.majorStars.map((star) => formatStarResponse(star)),
    minorStars: palace.minorStars.map((star) => formatStarResponse(star)),
    adjectiveStars: palace.adjectiveStars.map((star) => formatStarResponse(star)),
    changsheng12: palace.changsheng12,
    boshi12: palace.boshi12,
    jiangqian12: palace.jiangqian12,
    suiqian12: palace.suiqian12,
    decadal: {
      range: palace.decadal.range,
      heavenlyStem: palace.decadal.heavenlyStem,
      earthlyBranch: palace.decadal.earthlyBranch,
    },
    ages: palace.ages,
  };
}

/**
 * 格式化星盘实例为完整输出结构
 * 提取所有顶层属性并递归格式化十二宫
 *
 * @param astrolabe 星盘实例
 * @returns 星盘完整输出数据
 */
export function formatAstrolabeResponse(astrolabe: IAstrolabeInstance): AstrolabeOutput {
  return {
    gender: astrolabe.gender,
    solarDate: astrolabe.solarDate,
    lunarDate: astrolabe.lunarDate,
    chineseDate: astrolabe.chineseDate,
    time: astrolabe.time,
    timeRange: astrolabe.timeRange,
    sign: astrolabe.sign,
    zodiac: astrolabe.zodiac,
    earthlyBranchOfSoulPalace: astrolabe.earthlyBranchOfSoulPalace,
    earthlyBranchOfBodyPalace: astrolabe.earthlyBranchOfBodyPalace,
    soul: astrolabe.soul,
    body: astrolabe.body,
    fiveElementsClass: astrolabe.fiveElementsClass,
    copyright: astrolabe.copyright,
    palaces: astrolabe.palaces.map((palace) => formatPalaceResponse(palace)),
  };
}

/**
 * 安全的 JSON 序列化
 * 处理循环引用和不可序列化的值
 *
 * @param data 待序列化的数据
 * @returns 安全的 JSON 字符串
 */
export function toJSON(data: unknown): string {
  const seen = new WeakSet<object>();

  return JSON.stringify(
    data,
    (_key: string, value: unknown) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value as object)) {
          return '[Circular]';
        }

        seen.add(value as object);
      }

      return value;
    },
    2,
  );
}
