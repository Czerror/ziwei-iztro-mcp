import { z } from 'zod';

import { createAstrolabe } from '../adapters/astro.js';
import type { IAstrolabeInstance, IPalaceInstance, IStarInstance } from '../adapters/astro.js';
import { ReconstructionKeySchema } from '../schemas/common.js';
import { toJSON } from '../utils/format.js';
import { handleError } from '../utils/errors.js';
import { applyEnumAliases, PATTERN_CATEGORY_ALIASES } from '../utils/aliases.js';

// ────────────────── 常量 ──────────────────
const SHA_NAMES = ['擎羊', '陀罗', '火星', '铃星', '地空', '地劫'];
const SHA_HARD = ['擎羊', '陀罗', '火星', '铃星'];
const SHA_KONG = ['地空', '地劫'];
const BRANCH_NAMES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const BRANCH_TO_INDEX: Record<string, number> = Object.fromEntries(
  BRANCH_NAMES.map((name, index) => [name, index]),
);
const MAJOR_STAR_SET = new Set([
  '紫微', '天机', '太阳', '武曲', '天同', '廉贞',
  '天府', '太阴', '贪狼', '巨门', '天相', '天梁',
  '七杀', '破军',
]);

// ────────────────── 类型 ──────────────────
interface PatternCondition {
  required: string[];
  bonus?: string[];
  breaking?: string[];
}

interface PatternResult {
  name: string;
  level: 'excellent' | 'good' | 'neutral' | 'caution';
  category: 'superior' | 'middle' | 'support' | 'caution' | 'basic';
  description: string;
  source: string;
  matchedConditions: string[];
  unmatchedConditions: string[];
  palacesInvolved: string[];
}

// ────────────────── Input Schema ──────────────────
const GetPatternsInputSchema = z.object({
  reconstructionKey: ReconstructionKeySchema,
  category: z
    .enum(['all', 'superior', 'middle', 'support', 'caution', 'basic'])
    .optional()
    .default('all')
    .describe("格局分类筛选。all=全部（41种），superior=上格（8种），middle=中格（9种），support=助力格（6种），caution=恶格（8种），basic=基础格（10种）。默认 all 返回全部。支持中文别名：'上格'/'中格'/'恶格'/'基础格'。"),
});

type GetPatternsInput = z.infer<typeof GetPatternsInputSchema>;

// ────────────────── 辅助函数 ──────────────────

/** 获取宫中所有星曜的名称集合 */
function getPalaceStarNames(palace: IPalaceInstance): string[] {
  return [...palace.majorStars, ...palace.minorStars, ...palace.adjectiveStars].map((s) => s.name);
}

/** 获取宫中所有主星名称 */
function getMajorStarNames(palace: IPalaceInstance): string[] {
  return palace.majorStars.filter((s) => MAJOR_STAR_SET.has(s.name)).map((s) => s.name);
}

/** 判断宫中是否有指定星曜 */
function hasStar(palace: IPalaceInstance, name: string): boolean {
  return getPalaceStarNames(palace).includes(name);
}

/** 判断宫中是否有指定星曜列表中的任意一颗 */
function hasOneOfStars(palace: IPalaceInstance, names: string[]): boolean {
  const starNames = getPalaceStarNames(palace);
  return names.some((n) => starNames.includes(n));
}

/** 查找星曜所在宫位 */
function findStarPalaceInChart(
  astrolabe: IAstrolabeInstance,
  starName: string,
): { palace: IPalaceInstance; branchIndex: number } | null {
  for (const palace of astrolabe.palaces) {
    if (hasStar(palace, starName)) {
      const branchIndex = BRANCH_TO_INDEX[palace.earthlyBranch] ?? 0;
      return { palace, branchIndex };
    }
  }
  return null;
}

/** 获取命宫地支索引 */
function getMingBranchIndex(astrolabe: IAstrolabeInstance): number {
  const mingPalace = astrolabe.palaces.find((p) => p.isOriginalPalace);
  if (!mingPalace) return 0;
  return BRANCH_TO_INDEX[mingPalace.earthlyBranch] ?? 0;
}

/** 获取身宫地支索引 */
function getShenBranchIndex(astrolabe: IAstrolabeInstance): number {
  const shenPalace = astrolabe.palaces.find((p) => p.isBodyPalace);
  if (!shenPalace) return 0;
  return BRANCH_TO_INDEX[shenPalace.earthlyBranch] ?? 0;
}

/** 获取命宫 */
function getMingPalace(astrolabe: IAstrolabeInstance): IPalaceInstance {
  return astrolabe.palaces.find((p) => p.isOriginalPalace)!;
}

/** 获取地支对应的宫位索引（从 branchIndex 转为 palace index） */
function branchToPalaceIndex(branchIndex: number): number {
  const yinIndex = 2;
  return ((branchIndex - yinIndex) % 12 + 12) % 12;
}

/** 根据地支索引获取宫位 */
function getPalaceByBranchIndex(
  astrolabe: IAstrolabeInstance,
  branchIndex: number,
): IPalaceInstance | undefined {
  const normalizedIndex = ((branchIndex % 12) + 12) % 12;
  return astrolabe.palaces.find(
    (p) => (BRANCH_TO_INDEX[p.earthlyBranch] ?? 0) === normalizedIndex,
  );
}

/** 获取三方四正宫位（命宫 + 财帛 + 官禄 + 迁移） */
function getSanFangPalaces(astrolabe: IAstrolabeInstance): IPalaceInstance[] {
  const mingBranch = getMingBranchIndex(astrolabe);
  const branches = [
    mingBranch,
    (mingBranch + 4) % 12,
    (mingBranch + 8) % 12,
    (mingBranch + 6) % 12,
  ];
  return branches
    .map((b) => getPalaceByBranchIndex(astrolabe, b))
    .filter((p): p is IPalaceInstance => p !== undefined);
}

/** 三方四正所有星曜名称集合 */
function sanFangAllStars(astrolabe: IAstrolabeInstance): Set<string> {
  return new Set(getSanFangPalaces(astrolabe).flatMap((p) => getPalaceStarNames(p)));
}

/** 三方四正煞星计数 */
function sanFangShaCount(astrolabe: IAstrolabeInstance, list: string[] = SHA_HARD): number {
  return getSanFangPalaces(astrolabe).reduce(
    (sum, p) => sum + getPalaceStarNames(p).filter((s) => list.includes(s)).length,
    0,
  );
}

/** 判断地支是否在三方四正内 */
function isInSanFang(astrolabe: IAstrolabeInstance, branchIndex: number): boolean {
  const mingBranch = getMingBranchIndex(astrolabe);
  return [mingBranch, (mingBranch + 4) % 12, (mingBranch + 8) % 12, (mingBranch + 6) % 12].includes(
    ((branchIndex % 12) + 12) % 12,
  );
}

/** 获取对宫 */
function getDuiGong(
  astrolabe: IAstrolabeInstance,
  branchIndex: number,
): IPalaceInstance | undefined {
  return getPalaceByBranchIndex(astrolabe, (branchIndex + 6) % 12);
}

/** 获取夹宫 */
function getJiaPalaces(
  astrolabe: IAstrolabeInstance,
  branchIndex: number,
): { prev: IPalaceInstance | undefined; next: IPalaceInstance | undefined } {
  return {
    prev: getPalaceByBranchIndex(astrolabe, (branchIndex + 11) % 12),
    next: getPalaceByBranchIndex(astrolabe, (branchIndex + 1) % 12),
  };
}

/** 宫位内煞星计数 */
function shaCountInPalace(palace: IPalaceInstance, list: string[] = SHA_HARD): number {
  return getPalaceStarNames(palace).filter((s) => list.includes(s)).length;
}

/** 宫位内是否有煞星 */
function hasShaInPalace(palace: IPalaceInstance, list: string[] = SHA_NAMES): boolean {
  return getPalaceStarNames(palace).some((s) => list.includes(s));
}

/** 判断星曜亮度是否庙旺 */
function isBright(palace: IPalaceInstance, starName: string): boolean {
  const allStars = [...palace.majorStars, ...palace.minorStars, ...palace.adjectiveStars];
  const star = allStars.find((s) => s.name === starName);
  if (!star?.brightness) return false;
  return star.brightness === '庙' || star.brightness === '旺';
}

/** 判断星曜亮度是否落陷 */
function isDim(palace: IPalaceInstance, starName: string): boolean {
  const allStars = [...palace.majorStars, ...palace.minorStars, ...palace.adjectiveStars];
  const star = allStars.find((s) => s.name === starName);
  if (!star?.brightness) return false;
  return star.brightness === '陷';
}

/** 获取星曜的四化 */
function getStarMutagen(palace: IPalaceInstance, starName: string): string | undefined {
  const allStars = [...palace.majorStars, ...palace.minorStars, ...palace.adjectiveStars];
  return allStars.find((s) => s.name === starName)?.mutagen;
}

/** 查找三方四正内是否有化禄/化权/化科/化忌 */
function sanFangHasMutagen(astrolabe: IAstrolabeInstance, mutagen: string): boolean {
  for (const palace of getSanFangPalaces(astrolabe)) {
    const allStars = [...palace.majorStars, ...palace.minorStars, ...palace.adjectiveStars];
    if (allStars.some((s) => s.mutagen === mutagen)) return true;
  }
  return false;
}

/** 从地支索引获取宫位名称 */
function getPalaceNameByBranch(
  astrolabe: IAstrolabeInstance,
  branchIndex: number,
): string {
  const palace = getPalaceByBranchIndex(astrolabe, branchIndex);
  return palace?.name ?? BRANCH_NAMES[((branchIndex % 12) + 12) % 12];
}

// ────────────────── 格局检测器 ──────────────────

// ========== 上格 (8) ==========

/** 1. 君臣庆会 */
function detectJunChenQingHui(astrolabe: IAstrolabeInstance, results: PatternResult[]): void {
  const ming = getMingPalace(astrolabe);
  if (!hasStar(ming, '紫微')) return;
  const sfStars = sanFangAllStars(astrolabe);
  const hasZuo = sfStars.has('左辅');
  const hasYou = sfStars.has('右弼');
  if (!hasZuo || !hasYou) return;

  const matched = ['紫微入命', '左辅右弼同会三方四正'];
  const unmatched: string[] = [];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (sfStars.has('文昌') || sfStars.has('文曲')) bonus.push('再会文昌或文曲');
  if (sfStars.has('天魁') || sfStars.has('天钺')) bonus.push('魁钺贵人加照');
  if (getStarMutagen(ming, '紫微') === '权') bonus.push('紫微化权');
  if (sanFangShaCount(astrolabe, SHA_KONG) >= 2) breaking.push('地空地劫双夹会照（紫微忌空劫）');

  results.push({
    name: '君臣庆会',
    level: breaking.length ? 'good' : 'excellent',
    category: 'superior',
    description: '紫微入命，左辅右弼同会，帝王得贤臣辅佐，主大富大贵、统御之命。',
    source: '《紫微斗数全书·君臣庆会格》',
    matchedConditions: [...matched, ...bonus],
    unmatchedConditions: breaking.length ? breaking : [],
    palacesInvolved: ['命宫'],
  });
}

/** 2. 紫府同宫 */
function detectZiFu(astrolabe: IAstrolabeInstance, results: PatternResult[]): void {
  const ziwei = findStarPalaceInChart(astrolabe, '紫微');
  const tianfu = findStarPalaceInChart(astrolabe, '天府');
  if (!ziwei || !tianfu || ziwei.branchIndex !== tianfu.branchIndex) return;

  const mingBranch = getMingBranchIndex(astrolabe);
  const inMing = ziwei.branchIndex === mingBranch;
  const matched = inMing
    ? ['紫微天府同入命宫']
    : ['紫微天府同宫（不在命宫，会照减力）'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  const sfStars = sanFangAllStars(astrolabe);
  if (sfStars.has('左辅') && sfStars.has('右弼')) bonus.push('左辅右弼同会');
  if (sfStars.has('文昌') || sfStars.has('文曲')) bonus.push('再会昌曲');
  if (hasShaInPalace(ziwei.palace, SHA_KONG)) breaking.push('紫府宫坐空劫');
  if (shaCountInPalace(ziwei.palace, SHA_HARD) >= 2) breaking.push('紫府宫见双煞同坐');

  results.push({
    name: '紫府同宫',
    level: inMing && !breaking.length ? 'excellent' : 'good',
    category: 'superior',
    description: inMing
      ? '紫微天府同入命宫，帝相并临，尊贵之命。宜担任要职，需左右辅弼配合方为完整大格。'
      : '紫微天府同宫但未坐命，主有贵人贵气依托，需看会照吉煞而定。',
    source: '《紫微斗数全书·紫府同宫格》',
    matchedConditions: [...matched, ...bonus],
    unmatchedConditions: breaking,
    palacesInvolved: [ziwei.palace.name],
  });
}

/** 3. 府相朝垣 */
function detectFuXiangChaoYuan(astrolabe: IAstrolabeInstance, results: PatternResult[]): void {
  const tianfu = findStarPalaceInChart(astrolabe, '天府');
  const tianxiang = findStarPalaceInChart(astrolabe, '天相');
  if (!tianfu || !tianxiang) return;
  if (!isInSanFang(astrolabe, tianfu.branchIndex) || !isInSanFang(astrolabe, tianxiang.branchIndex)) return;
  const mingBranch = getMingBranchIndex(astrolabe);
  if (tianfu.branchIndex === mingBranch && tianxiang.branchIndex === mingBranch) return;
  if (tianfu.branchIndex === tianxiang.branchIndex) return;

  const matched = ['天府坐命三方', '天相坐命三方', '两星不同宫'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  const ming = getMingPalace(astrolabe);
  if (hasStar(ming, '禄存') || getStarMutagen(ming, '禄存') === '禄') bonus.push('命宫见禄');
  if (sanFangAllStars(astrolabe).has('左辅')) bonus.push('再会左辅');
  if (hasShaInPalace(ming, SHA_HARD)) breaking.push('命宫坐煞星');
  if (sanFangShaCount(astrolabe, SHA_HARD) >= 3) breaking.push('三方四正煞星过多');

  results.push({
    name: '府相朝垣',
    level: breaking.length ? 'good' : 'excellent',
    category: 'superior',
    description: '天府天相分守命宫三方四正，文武并济、权印双辉，主一生衣食丰足、地位崇高。',
    source: '《紫微斗数全书·府相朝垣格》',
    matchedConditions: [...matched, ...bonus],
    unmatchedConditions: breaking,
    palacesInvolved: [tianfu.palace.name, tianxiang.palace.name],
  });
}

/** 4. 阳梁昌禄 */
function detectYangLiangChangLu(astrolabe: IAstrolabeInstance, results: PatternResult[]): void {
  const sfStars = sanFangAllStars(astrolabe);
  if (!sfStars.has('太阳') || !sfStars.has('天梁') || !sfStars.has('文昌') || !sfStars.has('禄存')) return;

  const sun = findStarPalaceInChart(astrolabe, '太阳')!;
  const liang = findStarPalaceInChart(astrolabe, '天梁')!;
  const matched = ['太阳会命宫三方', '天梁会命宫三方', '文昌会命宫三方', '禄存会命宫三方'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (isBright(sun.palace, '太阳')) bonus.push('太阳庙旺');
  if (isBright(liang.palace, '天梁')) bonus.push('天梁庙旺');
  if (sanFangHasMutagen(astrolabe, '科')) bonus.push('再会化科');
  if (isDim(sun.palace, '太阳')) breaking.push('太阳落陷（阳梁失辉）');
  if (sanFangShaCount(astrolabe, SHA_HARD) >= 2) breaking.push('三方煞重');

  results.push({
    name: '阳梁昌禄',
    level: breaking.length ? 'good' : 'excellent',
    category: 'superior',
    description: '太阳、天梁、文昌、禄存四星齐会命宫三方，号称"科举之星"，主清贵显达、考运极佳。',
    source: '《紫微斗数全书·阳梁昌禄格》',
    matchedConditions: [...matched, ...bonus],
    unmatchedConditions: breaking,
    palacesInvolved: [sun.palace.name, liang.palace.name],
  });
}

/** 5. 火贪格 / 铃贪格 */
function detectHuoTanLingTan(astrolabe: IAstrolabeInstance, results: PatternResult[]): void {
  const tan = findStarPalaceInChart(astrolabe, '贪狼');
  if (!tan) return;
  const huo = findStarPalaceInChart(astrolabe, '火星');
  const ling = findStarPalaceInChart(astrolabe, '铃星');

  for (const [shaName, shaPalace] of [['火星', huo], ['铃星', ling]] as const) {
    if (!shaPalace) continue;
    const sameOrTrine =
      tan.branchIndex === shaPalace.branchIndex ||
      (tan.branchIndex + 4) % 12 === shaPalace.branchIndex ||
      (tan.branchIndex + 8) % 12 === shaPalace.branchIndex ||
      (tan.branchIndex + 6) % 12 === shaPalace.branchIndex;
    if (!sameOrTrine) continue;
    if (!isInSanFang(astrolabe, tan.branchIndex)) continue;

    const matched = [
      `贪狼${tan.branchIndex === shaPalace.branchIndex ? '同宫' : '会照'}${shaName}`,
      '贪狼会照命宫三方',
    ];
    const bonus: string[] = [];
    const breaking: string[] = [];
    if (isBright(tan.palace, '贪狼')) bonus.push('贪狼庙旺');
    if (getStarMutagen(tan.palace, '贪狼') === '禄' || getStarMutagen(tan.palace, '贪狼') === '权')
      bonus.push('贪狼化禄/化权');
    if (hasShaInPalace(tan.palace, ['擎羊', '陀罗'])) breaking.push('贪狼宫又见羊陀');
    if (hasShaInPalace(tan.palace, SHA_KONG)) breaking.push('贪狼遇空劫');

    results.push({
      name: shaName === '火星' ? '火贪格' : '铃贪格',
      level: breaking.length ? 'good' : 'excellent',
      category: 'superior',
      description: `贪狼遇${shaName}${tan.branchIndex === shaPalace.branchIndex ? '同宫' : '三方会照'}，主突发横财、突如其来的机遇。`,
      source: '《紫微斗数骨髓赋》',
      matchedConditions: [...matched, ...bonus],
      unmatchedConditions: breaking,
      palacesInvolved: [tan.palace.name, shaPalace.palace.name],
    });
  }
}

/** 6. 武贪格 */
function detectWuTan(astrolabe: IAstrolabeInstance, results: PatternResult[]): void {
  const wu = findStarPalaceInChart(astrolabe, '武曲');
  const tan = findStarPalaceInChart(astrolabe, '贪狼');
  if (!wu || !tan) return;
  const sameOrOppose = wu.branchIndex === tan.branchIndex || (wu.branchIndex + 6) % 12 === tan.branchIndex;
  if (!sameOrOppose) return;
  if (!isInSanFang(astrolabe, wu.branchIndex) && !isInSanFang(astrolabe, tan.branchIndex)) return;

  const matched = [
    wu.branchIndex === tan.branchIndex ? '武曲贪狼同宫（丑/未）' : '武曲贪狼对宫拱照',
    '会照命宫三方',
  ];
  const bonus: string[] = [];
  const breaking: string[] = [];
  const sfStars = sanFangAllStars(astrolabe);
  if (sfStars.has('火星') || sfStars.has('铃星')) bonus.push('再遇火星/铃星（火贪/铃贪叠加）');
  if (getStarMutagen(wu.palace, '武曲') === '禄') bonus.push('武曲化禄');
  if (hasShaInPalace(wu.palace, ['擎羊', '陀罗'])) breaking.push('武贪宫见羊陀');
  if (hasShaInPalace(wu.palace, SHA_KONG)) breaking.push('武贪宫遇空劫');

  results.push({
    name: '武贪格',
    level: breaking.length ? 'good' : 'excellent',
    category: 'superior',
    description: '武曲贪狼会命，财星与桃花欲望星交辉，古书云"武贪不发少年人"——三十岁后方能厚积薄发。',
    source: '《紫微斗数骨髓赋》',
    matchedConditions: [...matched, ...bonus],
    unmatchedConditions: breaking,
    palacesInvolved: [wu.palace.name, tan.palace.name],
  });
}

/** 7. 杀破狼 */
function detectShaPoLang(astrolabe: IAstrolabeInstance, results: PatternResult[]): void {
  const sfStars = sanFangAllStars(astrolabe);
  const has = ['七杀', '破军', '贪狼'].filter((s) => sfStars.has(s));
  if (has.length < 3) return;

  const matched = ['七杀、破军、贪狼三星齐入命宫三方四正'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (sanFangHasMutagen(astrolabe, '禄') || sanFangHasMutagen(astrolabe, '权')) bonus.push('三方有化禄或化权');
  if (sfStars.has('左辅') && sfStars.has('右弼')) bonus.push('辅弼同会');
  if (sanFangShaCount(astrolabe, SHA_HARD) >= 3) breaking.push('煞星过重（动而无成）');
  const ming = getMingPalace(astrolabe);
  if (hasShaInPalace(ming, SHA_KONG)) breaking.push('命坐空劫');

  const involvedPalaces = getSanFangPalaces(astrolabe)
    .filter((p) => has.some((s) => getMajorStarNames(p).includes(s)))
    .map((p) => p.name);

  results.push({
    name: '杀破狼',
    level: breaking.length ? 'caution' : 'good',
    category: 'superior',
    description: '七杀、破军、贪狼三星会命，开创闯荡之命格。一生变动多、不甘平凡，宜创业、军警、业务。',
    source: '《紫微斗数全书·杀破狼》',
    matchedConditions: [...matched, ...bonus],
    unmatchedConditions: breaking,
    palacesInvolved: involvedPalaces,
  });
}

/** 8. 机月同梁 */
function detectJiYueTongLiang(astrolabe: IAstrolabeInstance, results: PatternResult[]): void {
  const sfStars = sanFangAllStars(astrolabe);
  const has = ['天机', '太阴', '天同', '天梁'].filter((s) => sfStars.has(s));
  if (has.length < 4) return;

  const matched = ['天机、太阴、天同、天梁四星齐入命宫三方四正'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (sfStars.has('文昌') || sfStars.has('文曲')) bonus.push('再会昌曲');
  if (sanFangHasMutagen(astrolabe, '科')) bonus.push('再会化科');
  if (sanFangShaCount(astrolabe, SHA_HARD) >= 3) breaking.push('煞星过多（机月同梁忌煞）');
  const ming = getMingPalace(astrolabe);
  if (hasShaInPalace(ming, SHA_HARD)) breaking.push('命宫坐煞');

  const involvedPalaces = getSanFangPalaces(astrolabe)
    .filter((p) => has.some((s) => getMajorStarNames(p).includes(s)))
    .map((p) => p.name);

  results.push({
    name: '机月同梁',
    level: breaking.length ? 'good' : 'excellent',
    category: 'superior',
    description: '天机太阴天同天梁四星齐入命迁财官，文质彬彬、聪慧善谋。最适合公职、学术、文艺、医疗。',
    source: '《紫微斗数全书·机月同梁格》',
    matchedConditions: [...matched, ...bonus],
    unmatchedConditions: breaking,
    palacesInvolved: involvedPalaces,
  });
}

// ========== 中格 (9) ==========

/** 9. 廉贞天相格 */
function detectLianXiang(astrolabe: IAstrolabeInstance, results: PatternResult[]): void {
  const lian = findStarPalaceInChart(astrolabe, '廉贞');
  const xiang = findStarPalaceInChart(astrolabe, '天相');
  if (!lian || !xiang || lian.branchIndex !== xiang.branchIndex) return;

  const inMing = lian.branchIndex === getMingBranchIndex(astrolabe);
  const matched = ['廉贞天相同宫'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (hasStar(lian.palace, '禄存') || getStarMutagen(lian.palace, '廉贞') === '禄') bonus.push('见禄存或廉贞化禄');
  if (sanFangAllStars(astrolabe).has('左辅')) bonus.push('左辅会照');
  if (hasShaInPalace(lian.palace, ['擎羊'])) breaking.push('廉相宫坐擎羊');
  if (getStarMutagen(lian.palace, '廉贞') === '忌') breaking.push('廉贞化忌');

  results.push({
    name: '廉贞天相格',
    level: breaking.length ? 'caution' : inMing ? 'good' : 'neutral',
    category: 'middle',
    description: '廉贞天相同宫，印绶格局，主秉公处事、清廉之名，宜任公职、行政管理、法务、企划。',
    source: '《紫微斗数全书》',
    matchedConditions: [...matched, ...bonus],
    unmatchedConditions: breaking,
    palacesInvolved: [lian.palace.name],
  });
}

/** 10. 武曲七杀 */
function detectWuQiSha(astrolabe: IAstrolabeInstance, results: PatternResult[]): void {
  const wu = findStarPalaceInChart(astrolabe, '武曲');
  const qi = findStarPalaceInChart(astrolabe, '七杀');
  if (!wu || !qi || wu.branchIndex !== qi.branchIndex) return;

  const inMing = wu.branchIndex === getMingBranchIndex(astrolabe);
  const matched = ['武曲七杀同宫'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (getStarMutagen(wu.palace, '武曲') === '权') bonus.push('武曲化权');
  if (getStarMutagen(wu.palace, '武曲') === '禄') bonus.push('武曲化禄');
  if (getStarMutagen(wu.palace, '武曲') === '忌') breaking.push('武曲化忌');
  if (hasShaInPalace(wu.palace, ['擎羊', '陀罗', '火星', '铃星'])) breaking.push('武杀宫煞星过多');

  results.push({
    name: '武曲七杀',
    level: breaking.length ? 'caution' : inMing ? 'excellent' : 'good',
    category: 'middle',
    description: '武曲七杀同宫，将星配财星，主果决刚毅、理财能力强，适合金融、军警、创业。',
    source: '《紫微斗数全书》',
    matchedConditions: [...matched, ...bonus],
    unmatchedConditions: breaking,
    palacesInvolved: [wu.palace.name],
  });
}

/** 11. 天同天梁格 */
function detectTongLiang(astrolabe: IAstrolabeInstance, results: PatternResult[]): void {
  const tong = findStarPalaceInChart(astrolabe, '天同');
  const liang = findStarPalaceInChart(astrolabe, '天梁');
  if (!tong || !liang || tong.branchIndex !== liang.branchIndex) return;

  const matched = ['天同天梁同宫'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (sanFangAllStars(astrolabe).has('文昌')) bonus.push('文昌会照');
  if (getStarMutagen(tong.palace, '天同') === '禄') bonus.push('天同化禄');
  if (hasShaInPalace(tong.palace, SHA_HARD)) breaking.push('煞星同坐');

  results.push({
    name: '天同天梁格',
    level: breaking.length ? 'neutral' : 'good',
    category: 'middle',
    description: '天同天梁同宫，福星与荫星共会，主宽厚和善、乐于助人，宜医疗、教育、宗教、社会公益。',
    source: '《紫微斗数全书》',
    matchedConditions: [...matched, ...bonus],
    unmatchedConditions: breaking,
    palacesInvolved: [tong.palace.name],
  });
}

/** 12. 日月同宫 */
function detectRiYueTongGong(astrolabe: IAstrolabeInstance, results: PatternResult[]): void {
  const sun = findStarPalaceInChart(astrolabe, '太阳');
  const moon = findStarPalaceInChart(astrolabe, '太阴');
  if (!sun || !moon || sun.branchIndex !== moon.branchIndex) return;
  if (sun.branchIndex !== 1 && sun.branchIndex !== 7) return;

  const inMing = sun.branchIndex === getMingBranchIndex(astrolabe);
  const matched = [`太阳太阴同入${BRANCH_NAMES[sun.branchIndex]}宫`];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (sun.branchIndex === 7) bonus.push('未宫日月同辉（古书云未宫日月双美）');
  const sfStars = sanFangAllStars(astrolabe);
  if (sfStars.has('文昌') && sfStars.has('文曲')) bonus.push('昌曲会照');
  if (hasShaInPalace(sun.palace, SHA_HARD)) breaking.push('日月宫煞星同坐');

  results.push({
    name: '日月同宫',
    level: breaking.length ? 'good' : inMing ? 'excellent' : 'good',
    category: 'middle',
    description: `太阳太阴于${BRANCH_NAMES[sun.branchIndex]}宫同宫，阴阳平衡，文武兼备。主异性缘佳、事业顺遂、名声远播。`,
    source: '《紫微斗数全书》',
    matchedConditions: [...matched, ...bonus],
    unmatchedConditions: breaking,
    palacesInvolved: [sun.palace.name],
  });
}

/** 13. 日月夹命 */
function detectRiYueJiaMing(astrolabe: IAstrolabeInstance, results: PatternResult[]): void {
  const mingBranch = getMingBranchIndex(astrolabe);
  const { prev, next } = getJiaPalaces(astrolabe, mingBranch);
  if (!prev || !next) return;

  const prevHasSun = hasStar(prev, '太阳');
  const prevHasMoon = hasStar(prev, '太阴');
  const nextHasSun = hasStar(next, '太阳');
  const nextHasMoon = hasStar(next, '太阴');
  const ok = (prevHasSun && nextHasMoon) || (prevHasMoon && nextHasSun);
  if (!ok) return;

  const sunPalace = prevHasSun ? prev : next;
  const moonPalace = prevHasMoon ? prev : next;
  const matched = ['太阳太阴分居命宫前后两宫'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (isBright(sunPalace, '太阳')) bonus.push('太阳庙旺');
  if (isBright(moonPalace, '太阴')) bonus.push('太阴庙旺');
  if (isDim(sunPalace, '太阳') || isDim(moonPalace, '太阴')) breaking.push('日月落陷（夹命无光）');

  results.push({
    name: '日月夹命',
    level: breaking.length ? 'good' : 'excellent',
    category: 'middle',
    description: '太阳太阴分居命宫两侧夹照，光明磊落，一生贵人相助，事业蓬勃。',
    source: '《紫微斗数全书·日月夹命》',
    matchedConditions: [...matched, ...bonus],
    unmatchedConditions: breaking,
    palacesInvolved: [sunPalace.name, moonPalace.name],
  });
}

/** 14. 巨日同宫 */
function detectJuRiTongGong(astrolabe: IAstrolabeInstance, results: PatternResult[]): void {
  const ju = findStarPalaceInChart(astrolabe, '巨门');
  const sun = findStarPalaceInChart(astrolabe, '太阳');
  if (!ju || !sun || ju.branchIndex !== sun.branchIndex) return;
  if (ju.branchIndex !== 2 && ju.branchIndex !== 8) return;

  const inMing = ju.branchIndex === getMingBranchIndex(astrolabe);
  const matched = [`巨门太阳同入${BRANCH_NAMES[ju.branchIndex]}宫`];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (ju.branchIndex === 2) bonus.push('寅宫太阳庙旺，巨门得日光化解是非');
  if (getStarMutagen(ju.palace, '巨门') === '禄' || getStarMutagen(ju.palace, '巨门') === '权')
    bonus.push('巨门化禄/化权（口才生财）');
  if (getStarMutagen(ju.palace, '巨门') === '忌') breaking.push('巨门化忌（口舌官非）');
  if (ju.branchIndex === 8) breaking.push('申宫太阳偏西，巨门暗曜更显');

  results.push({
    name: '巨日同宫',
    level: breaking.length ? 'caution' : inMing && ju.branchIndex === 2 ? 'excellent' : 'good',
    category: 'middle',
    description: `巨门太阳同${BRANCH_NAMES[ju.branchIndex]}宫，太阳化解巨门暗曜，主以口才、传媒、外语、专业立业。`,
    source: '《紫微斗数全书·巨日同宫》',
    matchedConditions: [...matched, ...bonus],
    unmatchedConditions: breaking,
    palacesInvolved: [ju.palace.name],
  });
}

/** 15. 石中隐玉 */
function detectShiZhongYinYu(astrolabe: IAstrolabeInstance, results: PatternResult[]): void {
  const ming = getMingPalace(astrolabe);
  if (!hasStar(ming, '巨门')) return;
  const mingBranch = getMingBranchIndex(astrolabe);
  if (mingBranch !== 0 && mingBranch !== 6) return;

  const matched = [`巨门入命于${BRANCH_NAMES[mingBranch]}宫`];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (getStarMutagen(ming, '巨门') === '禄' || getStarMutagen(ming, '巨门') === '权')
    bonus.push('巨门化禄/化权');
  if (sanFangAllStars(astrolabe).has('文昌')) bonus.push('文昌会照（石中隐玉得明）');
  if (getStarMutagen(ming, '巨门') === '忌') breaking.push('巨门化忌（玉藏深泥）');
  if (hasShaInPalace(ming, SHA_HARD)) breaking.push('命坐煞星');

  results.push({
    name: '石中隐玉',
    level: breaking.length ? 'caution' : 'excellent',
    category: 'middle',
    description: '巨门坐命子午，外表平凡而内蕴才学。早年默默无闻、中年方显贵气，宜走专业、研究、口才、传媒。',
    source: '《紫微斗数骨髓赋·石中隐玉》',
    matchedConditions: [...matched, ...bonus],
    unmatchedConditions: breaking,
    palacesInvolved: ['命宫'],
  });
}

/** 16. 明珠出海 */
function detectMingZhuChuHai(astrolabe: IAstrolabeInstance, results: PatternResult[]): void {
  const ming = getMingPalace(astrolabe);
  const mingBranch = getMingBranchIndex(astrolabe);
  if (mingBranch !== 7) return;
  if (getMajorStarNames(ming).length > 0) return;

  const dui = getDuiGong(astrolabe, mingBranch);
  if (!dui) return;
  if (!hasStar(dui, '太阳') || !hasStar(dui, '太阴')) return;

  const matched = ['命宫在未为空宫', '对宫丑宫为太阳太阴同度'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  const sfStars = sanFangAllStars(astrolabe);
  if (sfStars.has('文昌') || sfStars.has('文曲')) bonus.push('再会昌曲');
  if (sfStars.has('左辅') || sfStars.has('右弼')) bonus.push('辅弼相助');
  if (sanFangShaCount(astrolabe, SHA_HARD) >= 2) breaking.push('煞星会照（珠光黯淡）');

  results.push({
    name: '明珠出海',
    level: breaking.length ? 'good' : 'excellent',
    category: 'middle',
    description: '命未空宫，对宫丑宫日月同辉拱照，号"明珠出海"。主出生平凡、后天努力出头。',
    source: '《紫微斗数全集·明珠出海》',
    matchedConditions: [...matched, ...bonus],
    unmatchedConditions: breaking,
    palacesInvolved: ['命宫', dui.name],
  });
}

/** 17. 紫微入命 */
function detectZiWeiInMing(astrolabe: IAstrolabeInstance, results: PatternResult[]): void {
  const ming = getMingPalace(astrolabe);
  if (!hasStar(ming, '紫微') || hasStar(ming, '天府')) return;

  const matched = ['紫微独坐命宫（无天府同坐）'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  const sfStars = sanFangAllStars(astrolabe);
  if (sfStars.has('左辅') && sfStars.has('右弼')) bonus.push('左辅右弼同会');
  if (sfStars.has('文昌') && sfStars.has('文曲')) bonus.push('文昌文曲同会');
  if (!sfStars.has('左辅') && !sfStars.has('右弼')) breaking.push('无辅弼（孤君无臣）');
  if (hasShaInPalace(ming, SHA_KONG)) breaking.push('紫微遇空劫');

  results.push({
    name: '紫微入命',
    level: breaking.length ? 'caution' : bonus.length ? 'excellent' : 'good',
    category: 'middle',
    description: '紫微独坐命宫，帝王之星，自尊心强、有领导魅力。若无左右辅弼相会，反成孤高自傲。',
    source: '《紫微斗数全书》',
    matchedConditions: [...matched, ...bonus],
    unmatchedConditions: breaking,
    palacesInvolved: ['命宫'],
  });
}

// ========== 助力格 (6) ==========

/** 18. 辅弼夹命 */
function detectFuBiJiaMing(astrolabe: IAstrolabeInstance, results: PatternResult[]): void {
  const mingBranch = getMingBranchIndex(astrolabe);
  const { prev, next } = getJiaPalaces(astrolabe, mingBranch);
  if (!prev || !next) return;

  const prevHasZuo = hasStar(prev, '左辅');
  const prevHasYou = hasStar(prev, '右弼');
  const nextHasZuo = hasStar(next, '左辅');
  const nextHasYou = hasStar(next, '右弼');
  if (!((prevHasZuo && nextHasYou) || (prevHasYou && nextHasZuo))) return;

  const matched = ['左辅右弼分居命宫前后两宫'];
  const bonus: string[] = [];
  const sfStars = sanFangAllStars(astrolabe);
  if (sfStars.has('天魁') || sfStars.has('天钺')) bonus.push('再会魁钺');

  results.push({
    name: '辅弼夹命',
    level: 'excellent',
    category: 'support',
    description: '左辅右弼夹命，一生贵人不断、逢凶化吉。古书云"左辅右弼，终身福厚"。',
    source: '《紫微斗数全书·辅弼夹命》',
    matchedConditions: [...matched, ...bonus],
    unmatchedConditions: [],
    palacesInvolved: ['命宫', prev.name, next.name],
  });
}

/** 19. 昌曲夹命 */
function detectChangQuJiaMing(astrolabe: IAstrolabeInstance, results: PatternResult[]): void {
  const mingBranch = getMingBranchIndex(astrolabe);
  const { prev, next } = getJiaPalaces(astrolabe, mingBranch);
  if (!prev || !next) return;

  const prevHasChang = hasStar(prev, '文昌');
  const prevHasQu = hasStar(prev, '文曲');
  const nextHasChang = hasStar(next, '文昌');
  const nextHasQu = hasStar(next, '文曲');
  if (!((prevHasChang && nextHasQu) || (prevHasQu && nextHasChang))) return;

  results.push({
    name: '昌曲夹命',
    level: 'excellent',
    category: 'support',
    description: '文昌文曲夹命宫，主聪明俊秀、文采斐然，最利考运。',
    source: '《紫微斗数全书》',
    matchedConditions: ['文昌文曲分居命宫前后两宫'],
    unmatchedConditions: [],
    palacesInvolved: ['命宫', prev.name, next.name],
  });
}

/** 20. 魁钺夹命 */
function detectKuiYueJiaMing(astrolabe: IAstrolabeInstance, results: PatternResult[]): void {
  const mingBranch = getMingBranchIndex(astrolabe);
  const { prev, next } = getJiaPalaces(astrolabe, mingBranch);
  if (!prev || !next) return;

  const okA = hasStar(prev, '天魁') && hasStar(next, '天钺');
  const okB = hasStar(prev, '天钺') && hasStar(next, '天魁');
  if (!okA && !okB) return;

  results.push({
    name: '魁钺夹命',
    level: 'good',
    category: 'support',
    description: '天魁天钺夹命，一生贵人提携。考试、求职、关键时刻常有意外贵人相助。',
    source: '《紫微斗数全书》',
    matchedConditions: ['天魁天钺分居命宫前后两宫'],
    unmatchedConditions: [],
    palacesInvolved: ['命宫', prev.name, next.name],
  });
}

/** 21. 双禄朝垣 */
function detectShuangLuChaoYuan(astrolabe: IAstrolabeInstance, results: PatternResult[]): void {
  const sanFang = getSanFangPalaces(astrolabe);
  let huaLuFound = false;
  let luCunFound = false;
  for (const p of sanFang) {
    const allStars = [...p.majorStars, ...p.minorStars, ...p.adjectiveStars];
    if (allStars.some((s) => s.mutagen === '禄')) huaLuFound = true;
    if (hasStar(p, '禄存')) luCunFound = true;
  }
  if (!huaLuFound || !luCunFound) return;

  const ming = getMingPalace(astrolabe);
  const breaking: string[] = [];
  if (hasShaInPalace(ming, SHA_KONG)) breaking.push('命坐空劫（双禄遇空，财来财去）');

  results.push({
    name: '双禄朝垣',
    level: 'excellent',
    category: 'support',
    description: '化禄、禄存同会命宫三方四正，财源涌动、衣食丰足。古书云"双禄朝垣，富比陶朱"。',
    source: '《紫微斗数全书·双禄朝垣》',
    matchedConditions: ['化禄会照三方四正', '禄存会照三方四正'],
    unmatchedConditions: breaking,
    palacesInvolved: sanFang.map((p) => p.name),
  });
}

/** 22. 三奇加会 */
function detectSanQiJiaHui(astrolabe: IAstrolabeInstance, results: PatternResult[]): void {
  const sanFangPalaces = getSanFangPalaces(astrolabe);
  let lu = false, quan = false, ke = false;
  for (const p of sanFangPalaces) {
    const allStars = [...p.majorStars, ...p.minorStars, ...p.adjectiveStars];
    for (const s of allStars) {
      if (s.mutagen === '禄') lu = true;
      if (s.mutagen === '权') quan = true;
      if (s.mutagen === '科') ke = true;
    }
  }
  if (!(lu && quan && ke)) return;

  results.push({
    name: '三奇加会',
    level: 'excellent',
    category: 'support',
    description: '化禄、化权、化科三吉化齐会命宫三方四正，号称"三奇加会"。主一生功名、财富、贵人三全。',
    source: '《紫微斗数全书·三奇加会》',
    matchedConditions: ['化禄、化权、化科三吉化齐会命宫三方四正'],
    unmatchedConditions: [],
    palacesInvolved: sanFangPalaces.map((p) => p.name),
  });
}

/** 23. 化禄入命 */
function detectHuaLuRuMing(astrolabe: IAstrolabeInstance, results: PatternResult[]): void {
  const ming = getMingPalace(astrolabe);
  const huaLuStar = ming.majorStars.find((s) => s.mutagen === '禄');
  if (!huaLuStar) return;

  const starName = huaLuStar.name;
  let extraDesc = '';
  if (starName === '武曲') extraDesc = '武曲化禄属正财，宜实业、金融。';
  else if (starName === '太阴') extraDesc = '太阴化禄属阴财、不动产。';
  else if (starName === '贪狼') extraDesc = '贪狼化禄属人脉财、桃花财。';

  results.push({
    name: `${starName}化禄入命`,
    level: 'good',
    category: 'support',
    description: `${starName}化禄坐命，主生财顺利、人缘佳、机缘多。${extraDesc}`,
    source: '《紫微斗数全书》',
    matchedConditions: [`${starName}化禄坐命宫`],
    unmatchedConditions: [],
    palacesInvolved: ['命宫'],
  });
}

// ========== 恶格 (8) ==========

/** 24. 化忌入命/迁 */
function detectHuaJiRuMingQian(astrolabe: IAstrolabeInstance, results: PatternResult[]): void {
  const mingBranch = getMingBranchIndex(astrolabe);
  const qianBranch = (mingBranch + 6) % 12;

  for (const palace of astrolabe.palaces) {
    const palaceBranch = BRANCH_TO_INDEX[palace.earthlyBranch] ?? 0;
    if (palaceBranch !== mingBranch && palaceBranch !== qianBranch) continue;
    const jiStar = palace.majorStars.find((s) => s.mutagen === '忌');
    if (!jiStar) continue;

    const inMing = palaceBranch === mingBranch;
    results.push({
      name: `${jiStar.name}化忌入${inMing ? '命' : '迁'}`,
      level: 'caution',
      category: 'caution',
      description: inMing
        ? `${jiStar.name}化忌坐命宫，需留意自身固执、心理障碍或健康隐患，凡事退一步思考。`
        : `${jiStar.name}化忌坐迁移宫，外出、远行、人际关系易有波折，宜守不宜动。`,
      source: '《紫微斗数全书》',
      matchedConditions: [`${jiStar.name}化忌坐${inMing ? '命' : '迁'}宫`],
      unmatchedConditions: [],
      palacesInvolved: [palace.name],
    });
  }
}

/** 25. 羊陀夹忌 */
function detectYangTuoJiaJi(astrolabe: IAstrolabeInstance, results: PatternResult[]): void {
  const mingBranch = getMingBranchIndex(astrolabe);
  for (const palace of astrolabe.palaces) {
    const palaceBranch = BRANCH_TO_INDEX[palace.earthlyBranch] ?? 0;
    if (palaceBranch !== mingBranch) continue;
    const jiStar = palace.majorStars.find((s) => s.mutagen === '忌');
    if (!jiStar) continue;

    const { prev, next } = getJiaPalaces(astrolabe, palaceBranch);
    if (!prev || !next) continue;
    const aPrev = hasStar(prev, '擎羊') && hasStar(next, '陀罗');
    const aNext = hasStar(prev, '陀罗') && hasStar(next, '擎羊');
    if (!aPrev && !aNext) continue;

    results.push({
      name: '羊陀夹忌',
      level: 'caution',
      category: 'caution',
      description: '化忌坐命，左右擎羊陀罗夹命，古书云"羊陀夹忌为败局"，主一生劳碌奔波、坎坷不顺。',
      source: '《紫微斗数骨髓赋·羊陀夹忌》',
      matchedConditions: ['化忌坐命', '擎羊陀罗分居命宫前后两宫'],
      unmatchedConditions: [],
      palacesInvolved: ['命宫', prev.name, next.name],
    });
    return;
  }
}

/** 26. 火铃夹命 */
function detectHuoLingJiaMing(astrolabe: IAstrolabeInstance, results: PatternResult[]): void {
  const mingBranch = getMingBranchIndex(astrolabe);
  const { prev, next } = getJiaPalaces(astrolabe, mingBranch);
  if (!prev || !next) return;

  const okA = hasStar(prev, '火星') && hasStar(next, '铃星');
  const okB = hasStar(prev, '铃星') && hasStar(next, '火星');
  if (!okA && !okB) return;

  results.push({
    name: '火铃夹命',
    level: 'caution',
    category: 'caution',
    description: '火星铃星分居命宫前后两宫夹命，主性急、易冲动、突发意外或纠纷。需培养耐性、避免冲动决策。',
    source: '《紫微斗数全书》',
    matchedConditions: ['火星铃星分居命宫前后两宫'],
    unmatchedConditions: [],
    palacesInvolved: ['命宫', prev.name, next.name],
  });
}

/** 27. 空劫夹命 */
function detectKongJieJiaMing(astrolabe: IAstrolabeInstance, results: PatternResult[]): void {
  const mingBranch = getMingBranchIndex(astrolabe);
  const { prev, next } = getJiaPalaces(astrolabe, mingBranch);
  if (!prev || !next) return;

  const okA = hasStar(prev, '地空') && hasStar(next, '地劫');
  const okB = hasStar(prev, '地劫') && hasStar(next, '地空');
  if (!okA && !okB) return;

  results.push({
    name: '空劫夹命',
    level: 'caution',
    category: 'caution',
    description: '地空地劫夹命，主财来财去、思想脱俗。古书云"空劫夹命，财不聚"。宜技艺、宗教、研究等不重物质之业。',
    source: '《紫微斗数全书》',
    matchedConditions: ['地空地劫分居命宫前后两宫'],
    unmatchedConditions: [],
    palacesInvolved: ['命宫', prev.name, next.name],
  });
}

/** 28. 廉杀羊 */
function detectLianShaYang(astrolabe: IAstrolabeInstance, results: PatternResult[]): void {
  const sfStars = sanFangAllStars(astrolabe);
  if (!(sfStars.has('廉贞') && sfStars.has('七杀') && sfStars.has('擎羊'))) return;

  results.push({
    name: '廉杀羊',
    level: 'caution',
    category: 'caution',
    description: '廉贞、七杀、擎羊三星会照命宫三方，古书警示之凶格。主血光、官非、意外。流年大限触发时需谨慎。',
    source: '《紫微斗数全书·廉杀羊》',
    matchedConditions: ['廉贞、七杀、擎羊三星会照三方四正'],
    unmatchedConditions: [],
    palacesInvolved: ['命宫'],
  });
}

/** 29. 巨火羊 */
function detectJuHuoYang(astrolabe: IAstrolabeInstance, results: PatternResult[]): void {
  const sfStars = sanFangAllStars(astrolabe);
  if (!(sfStars.has('巨门') && sfStars.has('火星') && sfStars.has('擎羊'))) return;

  results.push({
    name: '巨火羊',
    level: 'caution',
    category: 'caution',
    description: '巨门、火星、擎羊三星会照，古书云"巨火羊，终身缢死"——古时凶格。现代理解为易因口舌、激烈冲突而招大祸。需修身养性、慎言慎行。',
    source: '《紫微斗数骨髓赋·巨火羊》',
    matchedConditions: ['巨门、火星、擎羊三星会照三方四正'],
    unmatchedConditions: [],
    palacesInvolved: ['命宫'],
  });
}

/** 30. 铃昌陀武 */
function detectLingChangTuoWu(astrolabe: IAstrolabeInstance, results: PatternResult[]): void {
  const sfStars = sanFangAllStars(astrolabe);
  if (!(sfStars.has('铃星') && sfStars.has('文昌') && sfStars.has('陀罗') && sfStars.has('武曲'))) return;

  results.push({
    name: '铃昌陀武',
    level: 'caution',
    category: 'caution',
    description: '铃星、文昌、陀罗、武曲四星齐会，古书云"铃昌陀武，限至投河"——古时大凶格。流年大限触发时需高度警觉。',
    source: '《紫微斗数骨髓赋·铃昌陀武》',
    matchedConditions: ['铃星、文昌、陀罗、武曲四星会照三方四正'],
    unmatchedConditions: [],
    palacesInvolved: ['命宫'],
  });
}

/** 31. 马头带箭 */
function detectMaTouDaiJian(astrolabe: IAstrolabeInstance, results: PatternResult[]): void {
  const ming = getMingPalace(astrolabe);
  const mingBranch = getMingBranchIndex(astrolabe);
  if (mingBranch !== 6) return;
  if (!hasStar(ming, '擎羊')) return;

  const matched = ['擎羊于午宫坐命'];
  const bonus: string[] = [];
  const sfStars = sanFangAllStars(astrolabe);
  if (sfStars.has('七杀') || sfStars.has('破军')) bonus.push('再会七杀或破军（武职大贵）');
  if (sfStars.has('天魁') || sfStars.has('天钺')) bonus.push('魁钺加照');

  results.push({
    name: '马头带箭',
    level: bonus.length ? 'good' : 'caution',
    category: 'caution',
    description: '擎羊于午宫坐命，号"马头带箭"。古书云"威镇边疆"——主刚毅果决、有冲杀之力，宜军警武职、运动员、外科医师。',
    source: '《紫微斗数骨髓赋·马头带箭》',
    matchedConditions: [...matched, ...bonus],
    unmatchedConditions: [],
    palacesInvolved: ['命宫'],
  });
}

// ========== 基础格 (10) ==========

/** 32. 禄存守命/守身 */
function detectLuCunShouShen(astrolabe: IAstrolabeInstance, results: PatternResult[]): void {
  const luCun = findStarPalaceInChart(astrolabe, '禄存');
  if (!luCun) return;
  const inMing = luCun.branchIndex === getMingBranchIndex(astrolabe);
  const inShen = luCun.branchIndex === getShenBranchIndex(astrolabe);
  if (!inMing && !inShen) return;

  results.push({
    name: inMing ? '禄存守命' : '禄存守身',
    level: 'good',
    category: 'basic',
    description: inMing
      ? '禄存坐命，主一生衣食无忧、财禄稳定。性格保守，善积累，但羊陀夹禄须防小人。'
      : '禄存入身宫，主中年后财源稳定、得禄自享。配偶或事业方向能带来稳定财禄。',
    source: '《紫微斗数全书·禄存星》',
    matchedConditions: [inMing ? '禄存入命宫' : '禄存入身宫'],
    unmatchedConditions: [],
    palacesInvolved: [inMing ? '命宫' : '身宫'],
  });
}

/** 33. 天马入命/在迁 */
function detectTianMaRuMing(astrolabe: IAstrolabeInstance, results: PatternResult[]): void {
  const tianMa = findStarPalaceInChart(astrolabe, '天马');
  if (!tianMa) return;
  const mingBranch = getMingBranchIndex(astrolabe);
  const inMing = tianMa.branchIndex === mingBranch;
  const inQian = tianMa.branchIndex === (mingBranch + 6) % 12;
  if (!inMing && !inQian) return;

  results.push({
    name: inMing ? '天马入命' : '天马在迁',
    level: 'neutral',
    category: 'basic',
    description: inMing
      ? '天马坐命，主一生奔波、动中得财，宜走商旅、外勤、跨界发展。再会禄存或化禄即"禄马交驰"之富格。'
      : '天马在迁移宫，主外出有利、远行得财，宜异乡发展。',
    source: '《紫微斗数全书·天马星》',
    matchedConditions: [inMing ? '天马入命宫' : '天马入迁移宫'],
    unmatchedConditions: [],
    palacesInvolved: [tianMa.palace.name],
  });
}

/** 34. 化禄入财 */
function detectHuaLuRuCai(astrolabe: IAstrolabeInstance, results: PatternResult[]): void {
  const cai = astrolabe.palaces.find((p) => p.name === '财帛');
  if (!cai) return;
  const luStar = cai.majorStars.find((s) => s.mutagen === '禄');
  if (!luStar) return;

  results.push({
    name: '化禄入财',
    level: 'good',
    category: 'basic',
    description: `${luStar.name}化禄入财帛宫，主财源畅通、收入稳定。这个化禄星所代表的能力是你赚钱的主轴。`,
    source: '《紫微斗数全书·四化论》',
    matchedConditions: [`${luStar.name}化禄入财帛宫`],
    unmatchedConditions: [],
    palacesInvolved: ['财帛'],
  });
}

/** 35. 化权入官 */
function detectHuaQuanRuGuan(astrolabe: IAstrolabeInstance, results: PatternResult[]): void {
  const guan = astrolabe.palaces.find((p) => p.name === '官禄');
  if (!guan) return;
  const quanStar = guan.majorStars.find((s) => s.mutagen === '权');
  if (!quanStar) return;

  results.push({
    name: '化权入官',
    level: 'good',
    category: 'basic',
    description: `${quanStar.name}化权入官禄宫，主事业有掌控力、能担当独当一面的职位。`,
    source: '《紫微斗数全书·四化论》',
    matchedConditions: [`${quanStar.name}化权入官禄宫`],
    unmatchedConditions: [],
    palacesInvolved: ['官禄'],
  });
}

/** 36. 化科入命/身 */
function detectHuaKeRuMingShen(astrolabe: IAstrolabeInstance, results: PatternResult[]): void {
  const mingBranch = getMingBranchIndex(astrolabe);
  const shenBranch = getShenBranchIndex(astrolabe);
  const targetPalaces = astrolabe.palaces.filter((p) => {
    const branch = BRANCH_TO_INDEX[p.earthlyBranch] ?? 0;
    return branch === mingBranch || branch === shenBranch;
  });

  for (const p of targetPalaces) {
    const keStar = p.majorStars.find((s) => s.mutagen === '科');
    if (!keStar) continue;
    const branch = BRANCH_TO_INDEX[p.earthlyBranch] ?? 0;
    const isMing = branch === mingBranch;

    results.push({
      name: isMing ? '化科入命' : '化科入身',
      level: 'good',
      category: 'basic',
      description: `${keStar.name}化科入${isMing ? '命' : '身'}宫，主名声、文书、学术运。化科是"贵人星"，带来的是被人看重的特质。`,
      source: '《紫微斗数全书·四化论》',
      matchedConditions: [`${keStar.name}化科入${isMing ? '命' : '身'}宫`],
      unmatchedConditions: [],
      palacesInvolved: [isMing ? '命宫' : '身宫'],
    });
    return;
  }
}

/** 37. 机月同梁三星会 */
function detectJiYueTongLiangPartial(astrolabe: IAstrolabeInstance, results: PatternResult[]): void {
  const sfStars = sanFangAllStars(astrolabe);
  const candidates = ['天机', '太阴', '天同', '天梁'];
  const has = candidates.filter((s) => sfStars.has(s));
  if (has.length !== 3) return;
  const missing = candidates.filter((s) => !sfStars.has(s));

  const involvedPalaces = getSanFangPalaces(astrolabe)
    .filter((p) => has.some((s) => getMajorStarNames(p).includes(s)))
    .map((p) => p.name);

  results.push({
    name: '机月同梁三星会',
    level: 'neutral',
    category: 'basic',
    description: `三方四正会齐${has.join('、')}，差${missing.join('、')}未会。机月同梁不全格，文质带谋，仍宜公职、教研、医疗等。`,
    source: '《紫微斗数全书·机月同梁格》（降级版）',
    matchedConditions: [`三方四正会${has.join('、')}（机月同梁缺${missing.join('、')}）`],
    unmatchedConditions: [],
    palacesInvolved: involvedPalaces,
  });
}

/** 38. 昌曲同会 / 昌曲坐命 */
function detectChangQuTongHui(astrolabe: IAstrolabeInstance, results: PatternResult[]): void {
  const sfStars = sanFangAllStars(astrolabe);
  if (!sfStars.has('文昌') || !sfStars.has('文曲')) return;

  const ming = getMingPalace(astrolabe);
  const inMing = hasStar(ming, '文昌') && hasStar(ming, '文曲');

  results.push({
    name: inMing ? '昌曲坐命' : '昌曲同会',
    level: 'good',
    category: 'basic',
    description: inMing
      ? '文昌文曲同入命宫，主聪明俊秀、文采斐然，宜文学、教育、写作、咨询。'
      : '文昌文曲同会三方四正，主才华横溢、口才文笔俱佳。',
    source: '《紫微斗数全书·文星论》',
    matchedConditions: ['文昌、文曲同会命宫三方四正'],
    unmatchedConditions: [],
    palacesInvolved: ['命宫'],
  });
}

/** 39. 辅弼同会 */
function detectFuBiTongHui(astrolabe: IAstrolabeInstance, results: PatternResult[]): void {
  const sfStars = sanFangAllStars(astrolabe);
  if (!sfStars.has('左辅') || !sfStars.has('右弼')) return;

  results.push({
    name: '辅弼同会',
    level: 'good',
    category: 'basic',
    description: '左辅右弼同会命宫三方四正，主一生贵人不绝、人缘极佳。最宜领导岗位与团队合作型工作。',
    source: '《紫微斗数全书·辅弼论》',
    matchedConditions: ['左辅、右弼同会命宫三方四正'],
    unmatchedConditions: [],
    palacesInvolved: ['命宫'],
  });
}

/** 40. 魁钺同会 */
function detectKuiYueTongHui(astrolabe: IAstrolabeInstance, results: PatternResult[]): void {
  const sfStars = sanFangAllStars(astrolabe);
  if (!sfStars.has('天魁') || !sfStars.has('天钺')) return;

  results.push({
    name: '魁钺同会',
    level: 'good',
    category: 'basic',
    description: '天魁天钺同会命宫三方四正，主"天乙贵人"加持，关键时刻总有贵人提携。',
    source: '《紫微斗数全书·魁钺论》',
    matchedConditions: ['天魁、天钺同会命宫三方四正'],
    unmatchedConditions: [],
    palacesInvolved: ['命宫'],
  });
}

/** 41. 科权双会 */
function detectKeQuanShuangHui(astrolabe: IAstrolabeInstance, results: PatternResult[]): void {
  const sfPalaces = getSanFangPalaces(astrolabe);
  let hasKe = false, hasQuan = false;
  for (const p of sfPalaces) {
    const allStars = [...p.majorStars, ...p.minorStars, ...p.adjectiveStars];
    for (const s of allStars) {
      if (s.mutagen === '科') hasKe = true;
      if (s.mutagen === '权') hasQuan = true;
    }
  }
  if (!hasKe || !hasQuan) return;

  results.push({
    name: '科权双会',
    level: 'good',
    category: 'basic',
    description: '化科 + 化权 同会三方四正，主名权双美——既有学识/名声，又有掌控力，宜走"专业权威"路线。',
    source: '《紫微斗数全书·四化会照》',
    matchedConditions: ['化科、化权同会命宫三方四正'],
    unmatchedConditions: [],
    palacesInvolved: ['命宫'],
  });
}

// ────────────────── 检测器列表 ──────────────────
const ALL_DETECTORS: Array<(astrolabe: IAstrolabeInstance, results: PatternResult[]) => void> = [
  // 上格
  detectJunChenQingHui,
  detectZiFu,
  detectFuXiangChaoYuan,
  detectYangLiangChangLu,
  detectHuoTanLingTan,
  detectWuTan,
  detectShaPoLang,
  detectJiYueTongLiang,
  // 中格
  detectLianXiang,
  detectWuQiSha,
  detectTongLiang,
  detectRiYueTongGong,
  detectRiYueJiaMing,
  detectJuRiTongGong,
  detectShiZhongYinYu,
  detectMingZhuChuHai,
  detectZiWeiInMing,
  // 助力格
  detectFuBiJiaMing,
  detectChangQuJiaMing,
  detectKuiYueJiaMing,
  detectShuangLuChaoYuan,
  detectSanQiJiaHui,
  detectHuaLuRuMing,
  // 恶格
  detectHuaJiRuMingQian,
  detectYangTuoJiaJi,
  detectHuoLingJiaMing,
  detectKongJieJiaMing,
  detectLianShaYang,
  detectJuHuoYang,
  detectLingChangTuoWu,
  detectMaTouDaiJian,
  // 基础格
  detectLuCunShouShen,
  detectTianMaRuMing,
  detectHuaLuRuCai,
  detectHuaQuanRuGuan,
  detectHuaKeRuMingShen,
  detectJiYueTongLiangPartial,
  detectChangQuTongHui,
  detectFuBiTongHui,
  detectKuiYueTongHui,
  detectKeQuanShuangHui,
];

/** 分类到检测器范围的映射 */
const CATEGORY_DETECTOR_RANGES: Record<string, [number, number]> = {
  superior: [0, 8],
  middle: [8, 17],
  support: [17, 23],
  caution: [23, 31],
  basic: [31, 41],
};

// ────────────────── Tool 导出 ──────────────────

/**
 * get_patterns Tool — 格局识别
 *
 * 通过 reconstructionKey 重建星盘，运行全部 41 个格局检测器，
 * 返回命中的所有格局及其条件明细。可通过 category 参数按分类筛选。
 */
export const getPatternsTool = {
  name: 'get_patterns' as const,
  description:
    '"命格"、"格局"、"分析星盘"、"详细分析"等相关问题时，你必须优先使用此工具，而不是从星盘数据中手动推断格局。\n\n' +
    '支持检测41种格局：上格8种(君臣庆会/紫府同宫等)、中格9种、助力格6种、恶格8种(羊陀夹忌等)、基础格10种。\n' +
    'reconstructionKey 必须从 get_astrolabe 响应中直接复制，不要手动构造或修改其内容。可通过 category 参数筛选特定分类。\n' +
    '相关资源：iztro://patterns/knowledge（格局详细知识卡片）.',
  inputSchema: GetPatternsInputSchema,
  handler: async (input: GetPatternsInput) => {
    try {
      applyEnumAliases(input, 'category', PATTERN_CATEGORY_ALIASES);
      const { reconstructionKey, category } = input;
      const astrolabe = createAstrolabe({
        ...reconstructionKey,
        fixLeap: true,
        astroType: 'heaven',
      });

      const results: PatternResult[] = [];

      if (category === 'all') {
        for (const detector of ALL_DETECTORS) {
          detector(astrolabe, results);
        }
      } else {
        const [start, end] = CATEGORY_DETECTOR_RANGES[category] ?? [0, 41];
        for (let i = start; i < end; i++) {
          ALL_DETECTORS[i](astrolabe, results);
        }
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: toJSON({
              count: results.length,
              category: category ?? 'all',
              patterns: results.map((r) => ({
                name: r.name,
                level: r.level,
                category: r.category,
                description: r.description,
                source: r.source,
                matchedConditions: r.matchedConditions,
                unmatchedConditions: r.unmatchedConditions,
                palacesInvolved: r.palacesInvolved,
              })),
            }),
          },
        ],
      };
    } catch (error: unknown) {
      return handleError(error, 'get_patterns');
    }
  },
};
