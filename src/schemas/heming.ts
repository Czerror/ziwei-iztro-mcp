import { z } from 'zod';

import { ReconstructionKeySchema } from './common.js';

/**
 * 合盘类型 Schema
 * romance: 感情合盘 — 分析双方婚姻/恋爱兼容性
 * career: 事业合作合盘 — 分析双方事业合作兼容性
 * parenting: 亲子合盘 — 分析亲子关系
 */
export const SynastryTypeSchema = z
  .enum(['romance', 'career', 'parenting'])
  .describe('合盘类型：romance=感情合盘, career=事业合作合盘, parenting=亲子合盘');

/**
 * 合盘选项完整 Schema
 */
export const SynastryOptionsSchema = z.object({
  /** 甲方星盘重建密钥 */
  reconstructionKeyA: ReconstructionKeySchema.describe('甲方星盘重建密钥（从 get_astrolabe 响应中获取）'),
  /** 乙方星盘重建密钥 */
  reconstructionKeyB: ReconstructionKeySchema.describe('乙方星盘重建密钥（从 get_astrolabe 响应中获取）'),
  /** 合盘类型，默认 romance */
  synastryType: SynastryTypeSchema.optional().default('romance').describe('合盘类型'),
});

/** 十四主星名称枚举 */
export const MajorStarNameSchema = z.enum([
  '紫微', '天机', '太阳', '武曲', '天同', '廉贞',
  '天府', '太阴', '贪狼', '巨门', '天相', '天梁',
  '七杀', '破军',
]);

/**
 * 星耀断语查询 Schema
 */
export const HemingStarQuerySchema = z.object({
  /** 十四主星名称 */
  starName: MajorStarNameSchema.describe('十四主星名称，如"紫微"、"天府"'),
});

/** 合盘类型 */
export type SynastryType = z.infer<typeof SynastryTypeSchema>;

/** 合盘选项类型 */
export type SynastryOptions = z.infer<typeof SynastryOptionsSchema>;

/** 星耀断语查询类型 */
export type HemingStarQuery = z.infer<typeof HemingStarQuerySchema>;
