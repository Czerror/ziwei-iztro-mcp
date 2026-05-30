import { z } from 'zod';

import { createAstrolabe } from '../adapters/astro.js';
import type { IAstrolabeInstance, IPalaceInstance, IStarInstance } from '../adapters/astro.js';
import { SynastryOptionsSchema } from '../schemas/heming.js';
import { toJSON } from '../utils/format.js';
import { handleError } from '../utils/errors.js';
import {
  STAR_IN_FUQI_GU,
  MAP_COMPATIBILITY,
  HEMING_SCORE_CRITERIA,
  SYNASTRY_TYPE_LABELS,
  type SynastryType,
} from '../resources/heming-knowledge.js';

/** 主星名称常量 — 用于匹配命宫/夫妻宫主星 */
const MAJOR_STAR_SET = new Set<string>([
  '紫微', '天机', '太阳', '武曲', '天同', '廉贞',
  '天府', '太阴', '贪狼', '巨门', '天相', '天梁',
  '七杀', '破军',
]);

/**
 * 从宫位中提取所有十四主星的名称
 *
 * @param palace 宫位实例
 * @returns 该宫位中十四主星名称数组
 */
function getMajorStarNames(palace: IPalaceInstance): string[] {
  return palace.majorStars
    .filter((star) => MAJOR_STAR_SET.has(star.name))
    .map((star) => star.name);
}

/**
 * 在星盘的所有宫位中查找指定星耀
 *
 * @param astrolabe 星盘实例
 * @param starName 星耀名称
 * @returns 星耀和所在宫位，未找到时返回 null
 */
function findStarInAstrolabe(
  astrolabe: IAstrolabeInstance,
  starName: string,
): { star: IStarInstance; palace: IPalaceInstance } | null {
  for (const palace of astrolabe.palaces) {
    const allStars = [...palace.majorStars, ...palace.minorStars, ...palace.adjectiveStars];
    const found = allStars.find((s) => s.name === starName);
    if (found) {
      return { star: found, palace };
    }
  }
  return null;
}

/**
 * 判断亮度是否庙旺
 * 庙(worship)、旺(prosperous)状态为庙旺
 */
function isBrightWorshipOrProsperous(brightness: string | undefined): boolean {
  if (!brightness) return false;
  return brightness === '庙' || brightness === '旺';
}

/**
 * 判断亮度是否落陷
 */
function isBrightDeclining(brightness: string | undefined): boolean {
  if (!brightness) return false;
  return brightness === '陷';
}

/** 单方星耀引用信息 */
interface IStarKnowledgeRef {
  /** 星耀名称 */
  starName: string;
  /** 在 STAR_IN_FUQI_GU 中存在 */
  hasPhrase: boolean;
  /** 断语核心摘要（hasPhrase 为 true 时有效） */
  summary?: string;
  /** 对应的 Resource URI */
  resourceUri: string;
}

/** 夫妻宫互映分析结果 */
interface IMutualReflection {
  /** A的夫妻宫主星是否对应B的命宫主星 */
  aFuqiReflectsBMing: boolean;
  /** A夫妻宫匹配B命宫的主星列表 */
  aMatchingStars: string[];
  /** B的夫妻宫主星是否对应A的命宫主星 */
  bFuqiReflectsAMing: boolean;
  /** B夫妻宫匹配A命宫的主星列表 */
  bMatchingStars: string[];
  /** 是否为天作之合（双向互映） */
  isIdealMatch: boolean;
}

/** 太阳/太阴状态分析 */
interface ISunMoonStatus {
  /** 星耀名称（太阳/太阴） */
  starName: string;
  /** 所在宫位名称 */
  palaceName: string;
  /** 亮度 */
  brightness: string | undefined;
  /** 四化 */
  mutagen: string | undefined;
  /** 是否庙旺 */
  isWorship: boolean;
  /** 是否落陷 */
  isDeclining: boolean;
  /** 是否化忌 */
  isHuaJi: boolean;
}

/** 单方星盘摘要 */
interface IPersonSummary {
  gender: string;
  solarDate: string;
  lunarDate: string;
  mingPalace: {
    name: string;
    earthlyBranch: string;
    heavenlyStem: string;
    majorStars: string[];
  };
  fuqiPalace: {
    name: string;
    earthlyBranch: string;
    heavenlyStem: string;
    majorStars: string[];
  };
  fudePalace: {
    name: string;
    earthlyBranch: string;
    majorStars: string[];
  };
}

/**
 * 构建单方星盘摘要
 */
function buildPersonSummary(astrolabe: IAstrolabeInstance): IPersonSummary {
  const mingPalace = astrolabe.palace('命宫');
  const fuqiPalace = astrolabe.palace('夫妻');
  const fudePalace = astrolabe.palace('福德');

  return {
    gender: astrolabe.gender,
    solarDate: astrolabe.solarDate,
    lunarDate: astrolabe.lunarDate,
    mingPalace: {
      name: mingPalace?.name ?? '未知',
      earthlyBranch: mingPalace?.earthlyBranch ?? '未知',
      heavenlyStem: mingPalace?.heavenlyStem ?? '未知',
      majorStars: mingPalace ? getMajorStarNames(mingPalace) : [],
    },
    fuqiPalace: {
      name: fuqiPalace?.name ?? '未知',
      earthlyBranch: fuqiPalace?.earthlyBranch ?? '未知',
      heavenlyStem: fuqiPalace?.heavenlyStem ?? '未知',
      majorStars: fuqiPalace ? getMajorStarNames(fuqiPalace) : [],
    },
    fudePalace: {
      name: fudePalace?.name ?? '未知',
      earthlyBranch: fudePalace?.earthlyBranch ?? '未知',
      majorStars: fudePalace ? getMajorStarNames(fudePalace) : [],
    },
  };
}

/**
 * 分析夫妻宫互映
 *
 * 核心逻辑：A的夫妻宫主星 == B的命宫主星（以及反向）
 */
function analyzeMutualReflection(personA: IPersonSummary, personB: IPersonSummary): IMutualReflection {
  const aFuqiStars = new Set(personA.fuqiPalace.majorStars);
  const bFuqiStars = new Set(personB.fuqiPalace.majorStars);
  const aMingStars = new Set(personA.mingPalace.majorStars);
  const bMingStars = new Set(personB.mingPalace.majorStars);

  const aMatchingStars = [...aFuqiStars].filter((star) => bMingStars.has(star));
  const bMatchingStars = [...bFuqiStars].filter((star) => aMingStars.has(star));

  const isIdealMatch = aMatchingStars.length > 0 && bMatchingStars.length > 0;

  return {
    aFuqiReflectsBMing: aMatchingStars.length > 0,
    aMatchingStars,
    bFuqiReflectsAMing: bMatchingStars.length > 0,
    bMatchingStars,
    isIdealMatch,
  };
}

/**
 * 查命格兼容性评分
 *
 * 遍历 MAP_COMPATIBILITY 表，返回最高匹配评分
 */
function queryCompatibilityScore(starNamesA: string[], starNamesB: string[]): number {
  let bestRating = 0;

  for (const entry of MAP_COMPATIBILITY) {
    const aMatches = entry.starA.length === 0 || entry.starA.some((s) => starNamesA.includes(s));
    const bMatches = entry.starB.length === 0 || entry.starB.some((s) => starNamesB.includes(s));

    if (aMatches && bMatches) {
      bestRating = Math.max(bestRating, entry.rating);
    }
  }

  return bestRating;
}

/**
 * 查命格兼容性匹配条目描述
 */
function queryCompatibilityEntries(starNamesA: string[], starNamesB: string[]): Array<{ pair: string; rating: number; description: string }> {
  const results: Array<{ pair: string; rating: number; description: string }> = [];

  for (const entry of MAP_COMPATIBILITY) {
    const aMatches = entry.starA.length === 0 || entry.starA.some((s) => starNamesA.includes(s));
    const bMatches = entry.starB.length === 0 || entry.starB.some((s) => starNamesB.includes(s));

    if (aMatches && bMatches) {
      results.push({
        pair: entry.pair,
        rating: entry.rating,
        description: entry.description,
      });
    }
  }

  return results;
}

/**
 * 分析太阳/太阴状态
 *
 * 女命查太阳，男命查太阴
 */
function analyzeSunMoon(astrolabe: IAstrolabeInstance, gender: string): ISunMoonStatus | null {
  const targetStar = gender === 'female' ? '太阳' : '太阴';
  const found = findStarInAstrolabe(astrolabe, targetStar);

  if (!found) return null;

  return {
    starName: targetStar,
    palaceName: found.palace.name,
    brightness: found.star.brightness,
    mutagen: found.star.mutagen,
    isWorship: isBrightWorshipOrProsperous(found.star.brightness),
    isDeclining: isBrightDeclining(found.star.brightness),
    isHuaJi: found.star.mutagen === '忌',
  };
}

/** 合盘知识库 Resource 引用 */
interface IKnowledgeResources {
  /** 主星在夫妻宫断语 */
  starsInFuqiGu: string;
  /** 四化在夫妻宫断语 */
  sihuaInFuqiGu: string;
  /** 合盘核心方法论 */
  methodology: string;
  /** 婚姻杂曜说明 */
  marriageStarsBrief: string;
  /** 评分标准 */
  scoreCriteria: string;
  /** 兼容性速判表 */
  compatibility: string;
}

/** 合盘综合结果 */
interface ISynastryResult {
  synastryType: SynastryType;
  synastryTypeLabel: string;
  personA: IPersonSummary;
  personB: IPersonSummary;
  mutualReflection: IMutualReflection;
  compatibility: {
    rating: number;
    entries: Array<{ pair: string; rating: number; description: string }>;
  };
  sunMoon: {
    personA: ISunMoonStatus | null;
    personB: ISunMoonStatus | null;
    note: string;
  };
  knowledgeRefs: {
    personAFuqi: IStarKnowledgeRef[];
    personBFuqi: IStarKnowledgeRef[];
  };
  score: {
    level: string;
    criteria: string;
    rating: number;
  };
  /** 可查阅的合盘知识库 Resource URI 列表 */
  knowledgeResources: IKnowledgeResources;
}

/**
 * 计算合盘总体评分等级
 *
 * 基于夫妻宫互映结果、命格兼容性评分和太阳/太阴状态综合判断
 */
function calculateOverallScore(
  mutualReflection: IMutualReflection,
  compatibilityRating: number,
  sunMoonA: ISunMoonStatus | null,
  sunMoonB: ISunMoonStatus | null,
): { level: string; criteria: string; rating: number } {
  const hasSunJi = sunMoonA?.isHuaJi ?? false;
  const hasMoonJi = sunMoonB?.isHuaJi ?? false;
  const hasSunDecline = sunMoonA?.isDeclining ?? false;
  const hasMoonDecline = sunMoonB?.isDeclining ?? false;

  if (mutualReflection.isIdealMatch && compatibilityRating >= 4 && !hasSunJi && !hasMoonJi) {
    return { level: '五星', criteria: HEMING_SCORE_CRITERIA['五星'], rating: 5 };
  }

  if ((mutualReflection.aFuqiReflectsBMing || mutualReflection.bFuqiReflectsAMing) && compatibilityRating >= 3) {
    return { level: '四星', criteria: HEMING_SCORE_CRITERIA['四星'], rating: 4 };
  }

  if (compatibilityRating >= 3 && !hasSunJi && !hasMoonJi) {
    return { level: '三星', criteria: HEMING_SCORE_CRITERIA['三星'], rating: 3 };
  }

  if (hasSunDecline || hasMoonDecline || hasSunJi || hasMoonJi) {
    if (compatibilityRating <= 1) {
      return { level: '一星', criteria: HEMING_SCORE_CRITERIA['一星'], rating: 1 };
    }
    return { level: '二星', criteria: HEMING_SCORE_CRITERIA['二星'], rating: 2 };
  }

  return { level: '三星', criteria: HEMING_SCORE_CRITERIA['三星'], rating: 3 };
}

/** 合盘星耀断语 Resource URI */
const FUQI_GU_RESOURCE_URI = 'iztro://heming/stars-in-fuqi-gu';

/**
 * 构建知识库引用列表
 *
 * 返回星耀名称、是否存在断语、核心摘要、对应 Resource URI，
 * 让 AI 无需额外调用 Resource 即可获得核心知识
 */
function buildKnowledgeRefs(palace: { majorStars: string[] }): IStarKnowledgeRef[] {
  return palace.majorStars.map((starName) => {
    const phrase = STAR_IN_FUQI_GU[starName];
    return {
      starName,
      hasPhrase: phrase !== undefined,
      summary: phrase?.summary,
      resourceUri: FUQI_GU_RESOURCE_URI,
    };
  });
}

/**
 * get_synastry Tool — 合盘综合分析
 *
 * 对两人星盘进行合盘分析，包括：
 * 1. 双方基本信息（性别、命宫/夫妻宫/福德宫主星）
 * 2. 夫妻宫互映分析（甲方夫妻宫主星 vs 乙方命宫主星，反之亦然）
 * 3. 命格兼容性初步评估（基于双方命宫主星查速判表）
 * 4. 太阳/太阴状态（女命太阳、男命太阴）
 * 5. 知识库引用（匹配的断语引用，含核心摘要）
 * 6. 评分等级（1-5★，基于 HEMING_SCORE_CRITERIA）
 *
 * 需要先通过 get_astrolabe 分别获取两人的 reconstructionKey。
 *
 * 可查阅的合盘知识库 Resource（通过 readResource 访问）：
 * - iztro://heming/stars-in-fuqi-gu — 十四主星在夫妻宫的完整断语
 * - iztro://heming/sihua-in-fuqi-gu — 四化在夫妻宫的断语
 * - iztro://heming/methodology — 合盘核心方法论（必读）
 * - iztro://heming/marriage-stars-brief — 婚姻杂曜简要说明
 * - iztro://heming/score-criteria — 合盘评分标准
 * - iztro://heming/compatibility — 命格兼容性速判表
 */
export const getSynastryTool = {
  name: 'get_synastry' as const,
  description:
    '当需要进行合盘分析时，你必须优先使用此工具，而不是手动分别分析两人的星盘。\n\n' +
    '需要先通过 get_astrolabe 分别获取两人的 reconstructionKey。\n\n' +
    '分析内容：夫妻宫互映检测、命格兼容性评分(1-5★)、太阳太阴状态、四化飞化互参。\n' +
    '相关资源：iztro://heming/stars-in-fuqi-gu（十四主星断语）.',
  inputSchema: SynastryOptionsSchema,
  handler: async (input: z.infer<typeof SynastryOptionsSchema>) => {
    try {
      const { reconstructionKeyA, reconstructionKeyB, synastryType } = input;

      const commonOptions = {
        fixLeap: true as const,
        language: 'zh-CN' as const,
        astroType: 'heaven' as const,
      };

      const astrolabeA = createAstrolabe({ ...reconstructionKeyA, ...commonOptions });
      const astrolabeB = createAstrolabe({ ...reconstructionKeyB, ...commonOptions });

      const personA = buildPersonSummary(astrolabeA);
      const personB = buildPersonSummary(astrolabeB);

      const mutualReflection = analyzeMutualReflection(personA, personB);

      const compatibilityRating = queryCompatibilityScore(
        personA.mingPalace.majorStars,
        personB.mingPalace.majorStars,
      );

      const compatibilityEntries = queryCompatibilityEntries(
        personA.mingPalace.majorStars,
        personB.mingPalace.majorStars,
      );

      const sunMoonA = analyzeSunMoon(astrolabeA, personA.gender);
      const sunMoonB = analyzeSunMoon(astrolabeB, personB.gender);

      const sunMoonNote =
        '女命查太阳（代表丈夫）：庙旺=旺夫，落陷化忌=克夫；' +
        '男命查太阴（代表妻子）：庙旺=妻美贤，化忌=婆媳不和';

      const score = calculateOverallScore(mutualReflection, compatibilityRating, sunMoonA, sunMoonB);

      const knowledgeRefsA = buildKnowledgeRefs(personA.fuqiPalace);
      const knowledgeRefsB = buildKnowledgeRefs(personB.fuqiPalace);

      const knowledgeResources: IKnowledgeResources = {
        starsInFuqiGu: 'iztro://heming/stars-in-fuqi-gu',
        sihuaInFuqiGu: 'iztro://heming/sihua-in-fuqi-gu',
        methodology: 'iztro://heming/methodology',
        marriageStarsBrief: 'iztro://heming/marriage-stars-brief',
        scoreCriteria: 'iztro://heming/score-criteria',
        compatibility: 'iztro://heming/compatibility',
      };

      const result: ISynastryResult = {
        synastryType,
        synastryTypeLabel: SYNASTRY_TYPE_LABELS[synastryType],
        personA,
        personB,
        mutualReflection,
        compatibility: {
          rating: compatibilityRating,
          entries: compatibilityEntries,
        },
        sunMoon: {
          personA: sunMoonA,
          personB: sunMoonB,
          note: sunMoonNote,
        },
        knowledgeRefs: {
          personAFuqi: knowledgeRefsA,
          personBFuqi: knowledgeRefsB,
        },
        score,
        knowledgeResources,
      };

      return { content: [{ type: 'text' as const, text: toJSON(result) }] };
    } catch (error: unknown) {
      return handleError(error, 'get_synastry');
    }
  },
};
