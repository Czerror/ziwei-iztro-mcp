import type { IAstrolabeInstance, IPalaceInstance } from './astro.js';

/**
 * 获取宫位信息
 * 通过星盘实例查询指定宫位的完整数据
 *
 * @param astrolabe 星盘实例
 * @param palaceQuery 宫位名称（如 '命宫'）或索引（0-11）
 * @returns 宫位实例数据，未找到时返回 undefined
 */
export function getPalaceInfo(
  astrolabe: IAstrolabeInstance,
  palaceQuery: string | number,
): IPalaceInstance | undefined {
  return astrolabe.palace(palaceQuery);
}
