import { z } from 'zod';
import { GenderSchema, DATE_DESCRIPTION } from './astro.js';

/**
 * 星盘重建密钥 Schema（最小参数集，用于下游 Tool 重建星盘实例）
 * 仅包含 5 个必要字段，避免 AI 传递庞大的完整星盘数据时遗漏字段。
 */
export const ReconstructionKeySchema = z.object({
  dateType: z.enum(['solar', 'lunar']),
  date: z.string().regex(/^\d{4}-\d{1,2}-\d{1,2}$/, '日期格式必须为 YYYY-M-D').describe(DATE_DESCRIPTION),
  timeIndex: z.number().int().min(0).max(12),
  gender: GenderSchema,
  isLeapMonth: z.boolean().optional().default(false),
});

/** 星盘重建密钥类型 */
export type ReconstructionKey = z.infer<typeof ReconstructionKeySchema>;

/**
 * 支持的语言枚举
 */
export const LanguageSchema = z.enum(['zh-CN', 'zh-TW', 'en-US', 'ja-JP', 'ko-KR', 'vi-VN']);

/**
 * 星耀简要信息 Schema（用于 Tool 间传递）
 */
export const StarBriefSchema = z.object({
  name: z.string(),
  type: z.string(),
  scope: z.string(),
  brightness: z.string().optional(),
  mutagen: z.string().optional(),
});

/**
 * 宫位数据 Schema（星盘中的单个宫位）
 */
export const PalaceDataSchema = z.object({
  index: z.number().int().min(0).max(11),
  name: z.string(),
  isBodyPalace: z.boolean(),
  isOriginalPalace: z.boolean(),
  heavenlyStem: z.string(),
  earthlyBranch: z.string(),
  majorStars: z.array(StarBriefSchema),
  minorStars: z.array(StarBriefSchema),
  adjectiveStars: z.array(StarBriefSchema),
  changsheng12: z.string(),
  boshi12: z.string(),
  jiangqian12: z.string(),
  suiqian12: z.string(),
  decadal: z.object({
    range: z.array(z.number().int()).min(2).max(2),
    heavenlyStem: z.string(),
    earthlyBranch: z.string(),
  }),
  ages: z.array(z.number()),
});

/**
 * 完整星盘数据 Schema（用于 Tool 间传递完整星盘上下文）
 */
export const AstrolabeDataSchema = z.object({
  gender: GenderSchema,
  solarDate: z.string(),
  lunarDate: z.string(),
  chineseDate: z.string(),
  time: z.string(),
  timeRange: z.string(),
  sign: z.string(),
  zodiac: z.string(),
  earthlyBranchOfSoulPalace: z.string(),
  earthlyBranchOfBodyPalace: z.string(),
  soul: z.string(),
  body: z.string(),
  fiveElementsClass: z.string(),
  copyright: z.string(),
  palaces: z.array(PalaceDataSchema),
});

/** 语言类型 */
export type Language = z.infer<typeof LanguageSchema>;

/** 星耀简要信息类型 */
export type StarBrief = z.infer<typeof StarBriefSchema>;

/** 宫位数据类型 */
export type PalaceData = z.infer<typeof PalaceDataSchema>;

/** 完整星盘数据类型 */
export type AstrolabeData = z.infer<typeof AstrolabeDataSchema>;
