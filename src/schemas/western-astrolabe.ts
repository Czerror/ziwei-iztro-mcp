/**
 * 西方占星星盘 Schema 与类型定义
 *
 * 基于 mingyu 项目 celestine 库的调用方式，
 * 为 MCP Tool 提供 Zod 输入 schema 和完整的 TypeScript 输出类型。
 * 中文标签映射常量定义在 adapters/celestine.ts 中。
 */
import { z } from 'zod';

// ============================================================================
// Zod 输入 Schema
// ============================================================================

/** 西方星盘出生信息输入 Schema */
export const WesternAstrolabeOptionsSchema = z.object({
  name: z.string().optional().describe('姓名（可选）'),
  gender: z.enum(['male', 'female', '']).optional().describe('性别：male=男, female=女。支持中文别名。'),
  year: z.number().int().min(1900).max(2100).describe('出生年'),
  month: z.number().int().min(1).max(12).describe('出生月'),
  day: z.number().int().min(1).max(31).describe('出生日'),
  hour: z.number().int().min(0).max(23).describe('出生小时（24小时制）'),
  minute: z.number().int().min(0).max(59).describe('出生分钟'),
  latitude: z.number().min(-90).max(90)
    .describe('出生地纬度（北纬为正）。AI 应根据用户提供的城市名自行推断。'),
  longitude: z.number().min(-180).max(180)
    .describe('出生地经度（东经为正）。AI 应根据用户提供的城市名自行推断。'),
  useSolarTime: z.boolean().optional().default(false)
    .describe('是否启用真太阳时校准。默认false。当用户明确要求真太阳时校准时设为true'),
  timezone: z.number().min(-12).max(14).default(8).describe('时区偏移，例如中国大陆为 8'),
  locationName: z.string().optional().describe('出生地点名称（仅供参考）'),
  houseSystem: z.string().optional().default('P').describe('宫位系统，默认 P=Placidus'),
  language: z.enum(['zh-CN', 'en-US']).optional().default('zh-CN').describe('输出语言，默认 zh-CN'),
});

/** 西方星盘运限分析输入 Schema（继承出生参数 + 目标日期） */
export const WesternScopeOptionsSchema = WesternAstrolabeOptionsSchema.extend({
  scopeType: z.enum(['transit']).default('transit').describe('运限类型：当前仅支持 transit=行运'),
  targetYear: z.number().int().min(1900).max(2200).describe('目标年份'),
  targetMonth: z.number().int().min(1).max(12).describe('目标月份'),
  targetDay: z.number().int().min(1).max(31).describe('目标日'),
  targetHour: z.number().int().min(0).max(23).optional().default(12).describe('目标小时（默认12）'),
  targetMinute: z.number().int().min(0).max(59).optional().default(0).describe('目标分钟（默认0）'),
});

/** 本命盘输入类型 */
export type WesternAstrolabeOptions = z.infer<typeof WesternAstrolabeOptionsSchema>;

/** 行运输入类型 */
export type WesternScopeOptions = z.infer<typeof WesternScopeOptionsSchema>;

// ============================================================================
// TypeScript 输出类型
// ============================================================================

/** 星盘点位（行星/轴点/宫头通用结构） */
export interface WesternAstrolabePoint {
  /** 英文名 (Sun, Moon, Ascendant...) */
  name: string;
  /** 中文标签 (太阳, 月亮, 上升...) */
  label: string;
  /** 黄经度数 (0-360) */
  longitude: number;
  /** 星座中文名 */
  sign: string;
  /** 星座内度数 */
  degree: number;
  /** 星座内分数 */
  minute: number;
  /** 落入宫位 (轴点为 0) */
  house: number;
  /** 格式化位置 (如 "金牛座29°08′") */
  formatted: string;
  /** 是否逆行 */
  retrograde?: boolean;
}

/** 相位信息 */
export interface WesternAstrolabeAspect {
  /** 星体1中文名 */
  body1: string;
  /** 星体2中文名 */
  body2: string;
  /** 相位类型中文 (合相/六合/刑相/拱相/冲相) */
  type: string;
  /** 相位符号 */
  symbol: string;
  /** 容许度偏差 */
  orb: number;
  /** 相位强度 (0-100) */
  strength: number;
  /** 入相位/出相位 */
  applying: boolean | null;
}

/** 出生信息 */
export interface WesternBirthInfo {
  /** 姓名 */
  name: string;
  /** 性别 */
  gender: string;
  /** 出生日期时间字符串 */
  dateTime: string;
  /** 出生地点描述 */
  location: string;
  /** 时区偏移 */
  timezone: number;
  /** 标准时间字符串 */
  standardDateTime?: string;
  /** 真太阳时字符串 */
  trueSolarDateTime?: string;
  /** 是否使用了真太阳时 */
  isTrueSolarTime?: boolean;
  /** 真太阳时校准时间字符串（Meeus 算法） */
  solar_time?: string;
}

/** 星盘摘要 */
export interface WesternChartSummary {
  /** 四元素分布 (火/土/风/水 → 行星中文名列表) */
  elements: Record<string, string[]>;
  /** 三模态分布 (开创/固定/变动 → 行星中文名列表) */
  modalities: Record<string, string[]>;
  /** 逆行行星中文名列表 */
  retrograde: string[];
  /** 格局模式列表 */
  patterns: string[];
}

/** 西方占星本命星盘完整数据 */
export interface WesternAstrolabeData {
  /** 出生信息 */
  birth: WesternBirthInfo;
  /** 10大行星位置 */
  planets: WesternAstrolabePoint[];
  /** 四轴点 (ASC/DSC/MC/IC) */
  angles: WesternAstrolabePoint[];
  /** 12宫位宫头位置 */
  houses: WesternAstrolabePoint[];
  /** 所有主要相位 */
  aspects: WesternAstrolabeAspect[];
  /** 星盘摘要（元素/模式/逆行/格局） */
  summary: WesternChartSummary;
  /** 生成时间戳 */
  timestamp: number;
}

/** 行运相位 */
export interface WesternTransitAspect {
  /** 行运行星英文名 */
  transitingBody: string;
  /** 行运行星中文名 */
  transitingBodyLabel: string;
  /** 本命点英文名 */
  natalPoint: string;
  /** 本命点中文名 */
  natalPointLabel: string;
  /** 相位类型中文名 */
  aspectType: string;
  /** 相位符号 */
  symbol: string;
  /** 偏差度数 */
  deviation: number;
  /** 相位强度 (0-100) */
  strength: number;
  /** 入相/精准/出相 */
  phase: string;
  /** 行运行星是否逆行 */
  isRetrograde: boolean;
}

/** 行运落宫 */
export interface WesternTransitHouse {
  /** 行运行星英文名 */
  body: string;
  /** 行运行星中文名 */
  bodyLabel: string;
  /** 当前位置（格式化字符串） */
  position: string;
  /** 落入本命第几宫 */
  natalHouse: number | null;
  /** 是否逆行 */
  isRetrograde: boolean;
}

/** 行运分析完整数据 */
export interface WesternScopeData {
  /** 本命盘摘要（精简版，供 AI 上下文参考） */
  natalSummary: WesternNatalSummary;
  /** 运限类型 */
  scopeType: string;
  /** 目标日期字符串 */
  targetDate: string;
  /** 取样时间（锚点） */
  anchorDateTime: string;
  /** 本命宫主星链条文本 */
  houseRulerChain: string;
  /** 行运相位列表 */
  transitAspects: WesternTransitAspect[];
  /** 行运落宫列表 */
  transitHouses: WesternTransitHouse[];
  /** 技术限制声明 */
  limitationNotice: string;
}

/** 本命盘精简摘要（嵌入 scope 输出） */
export interface WesternNatalSummary {
  /** 出生日期时间 */
  dateTime: string;
  /** 出生地点 */
  location: string;
  /** 行星摘要（行星名→星座+宫位） */
  planets: Record<string, string>;
  /** 四轴点摘要 */
  angles: Record<string, string>;
  /** 星盘摘要 */
  chartSummary: WesternChartSummary;
}
