import { z } from 'zod';

/**
 * 宫位索引 Schema（0-11）
 */
export const PalaceIndexSchema = z.number().int().min(0).max(11);

/**
 * 作用范围 Schema
 */
export const ScopeSchema = z.enum(['origin', 'decadal', 'yearly']);

/**
 * 宫位查询参数 Schema（支持名称或索引字符串）
 *
 * 使用 string 类型以兼容 OpenAI function calling 规范（避免 anyOf）。
 * 若传入纯数字字符串（如 "3"），适配层会自动解析为宫位索引。
 */
export const PalaceQuerySchema = z.string().min(1, '宫位查询参数不能为空');

/** 宫位索引类型 */
export type PalaceIndex = z.infer<typeof PalaceIndexSchema>;

/** 作用范围类型 */
export type Scope = z.infer<typeof ScopeSchema>;

/** 宫位查询参数类型 */
export type PalaceQuery = z.infer<typeof PalaceQuerySchema>;
