import { data } from 'iztro';
import {
  STAR_IN_FUQI_GU,
  SIHUA_IN_FUQI_GU,
  HEMING_METHODOLOGY,
  MARRIAGE_STARS_BRIEF,
  HEMING_SCORE_CRITERIA,
  MAP_COMPATIBILITY,
} from './heming-knowledge.js';
import { PATTERNS_KNOWLEDGE } from './patterns-knowledge.js';

const { LANGUAGES, HEAVENLY_STEMS, EARTHLY_BRANCHES, CHINESE_TIME, TIME_RANGE, PALACES } = data;

/** 星耀常量数据（硬编码，避免依赖 iztro 内部结构） */
const STAR_CATALOG = {
  majorStars: [
    { key: 'ziweiMaj', nameZH: '紫微', nameEN: 'Emperor', fiveElements: '土', yinYang: '阴' },
    { key: 'tianjiMaj', nameZH: '天机', nameEN: 'Oracle', fiveElements: '木', yinYang: '阴' },
    { key: 'taiyangMaj', nameZH: '太阳', nameEN: 'Sun', fiveElements: '火', yinYang: '阳' },
    { key: 'wuquMaj', nameZH: '武曲', nameEN: 'Finance', fiveElements: '金', yinYang: '阴' },
    { key: 'tiantongMaj', nameZH: '天同', nameEN: 'Sympathy', fiveElements: '水', yinYang: '阳' },
    { key: 'lianzhenMaj', nameZH: '廉贞', nameEN: 'Integrity', fiveElements: '火', yinYang: '阴' },
    { key: 'tianfuMaj', nameZH: '天府', nameEN: 'Empress', fiveElements: '土', yinYang: '阳' },
    { key: 'taiyinMaj', nameZH: '太阴', nameEN: 'Moon', fiveElements: '水', yinYang: '阴' },
    { key: 'tanlangMaj', nameZH: '贪狼', nameEN: 'Desire', fiveElements: '水', yinYang: '阳' },
    { key: 'jumenMaj', nameZH: '巨门', nameEN: 'GreatGate', fiveElements: '土', yinYang: '阴' },
    { key: 'tianxiangMaj', nameZH: '天相', nameEN: 'Minister', fiveElements: '水', yinYang: '阳' },
    { key: 'tianliangMaj', nameZH: '天梁', nameEN: 'Blessing', fiveElements: '土', yinYang: '阳' },
    { key: 'qishaMaj', nameZH: '七杀', nameEN: 'Power', fiveElements: '金', yinYang: '阳' },
    { key: 'pojunMaj', nameZH: '破军', nameEN: 'Ruin', fiveElements: '水', yinYang: '阴' },
  ],
  minorStars: {
    soft: [
      { key: 'zuofuMin', nameZH: '左辅', nameEN: 'Left Assistant' },
      { key: 'youbiMin', nameZH: '右弼', nameEN: 'Right Assistant' },
      { key: 'wenchangMin', nameZH: '文昌', nameEN: 'Literary' },
      { key: 'wenquMin', nameZH: '文曲', nameEN: 'Arts' },
      { key: 'tiangaoMin', nameZH: '天魁', nameEN: 'Heaven Leader' },
      { key: 'tianyueMin', nameZH: '天钺', nameEN: 'Heaven Halberd' },
      { key: 'lucunMin', nameZH: '禄存', nameEN: 'Fortune' },
      { key: 'tianmaMin', nameZH: '天马', nameEN: 'Heaven Horse' },
    ],
    tough: [
      { key: 'huoxingMin', nameZH: '火星', nameEN: 'Fire Star' },
      { key: 'lingxingMin', nameZH: '铃星', nameEN: 'Bell Star' },
      { key: 'qingyangMin', nameZH: '擎羊', nameEN: 'Goat' },
      { key: 'tuoluoMin', nameZH: '陀罗', nameEN: 'Spiral' },
      { key: 'dikongMin', nameZH: '地空', nameEN: 'Earth Void' },
      { key: 'dijieMin', nameZH: '地劫', nameEN: 'Earth Calamity' },
    ],
  },
  adjectiveStars: [
    { key: 'tianguanAdj', nameZH: '天官', nameEN: 'Heaven Officer' },
    { key: 'tianfuAdj', nameZH: '天福', nameEN: 'Heaven Fortune' },
    { key: 'tianchuAdj', nameZH: '天厨', nameEN: 'Heaven Kitchen' },
    { key: 'tiankuAdj', nameZH: '天哭', nameEN: 'Heaven Weep' },
    { key: 'tianxuAdj', nameZH: '天虚', nameEN: 'Heaven Void' },
    { key: 'longchiAdj', nameZH: '龙池', nameEN: 'Dragon Pool' },
    { key: 'fenggeAdj', nameZH: '凤阁', nameEN: 'Phoenix Pavilion' },
    { key: 'hongluanAdj', nameZH: '红鸾', nameEN: 'Red Phoenix' },
    { key: 'tianxiAdj', nameZH: '天喜', nameEN: 'Heaven Joy' },
    { key: 'guchenAdj', nameZH: '孤辰', nameEN: 'Solitude' },
    { key: 'guasuAdj', nameZH: '寡宿', nameEN: 'Widow' },
    { key: 'jieshenAdj', nameZH: '解神', nameEN: 'Relief' },
    { key: 'posuiAdj', nameZH: '破碎', nameEN: 'Shatter' },
    { key: 'taifuAdj', nameZH: '台辅', nameEN: 'Platform' },
    { key: 'fenggaoAdj', nameZH: '封诰', nameEN: 'Title' },
    { key: 'tianwuAdj', nameZH: '天巫', nameEN: 'Heaven Shaman' },
    { key: 'tianyueAdj', nameZH: '天月', nameEN: 'Heaven Moon' },
    { key: 'yinshaAdj', nameZH: '阴煞', nameEN: 'Yin Killer' },
    { key: 'tianxingAdj', nameZH: '天刑', nameEN: 'Heaven Punishment' },
    { key: 'tianyaoAdj', nameZH: '天姚', nameEN: 'Heaven Charm' },
    { key: 'santaiAdj', nameZH: '三台', nameEN: 'Three Platforms' },
    { key: 'bazuoAdj', nameZH: '八座', nameEN: 'Eight Seats' },
    { key: 'tianshiAdj', nameZH: '天使', nameEN: 'Heaven Messenger' },
    { key: 'tianshangAdj', nameZH: '天伤', nameEN: 'Heaven Wound' },
    { key: 'enkguangAdj', nameZH: '恩光', nameEN: 'Grace Light' },
    { key: 'tianguiAdj', nameZH: '天贵', nameEN: 'Heaven Noble' },
    { key: 'boshiAdj', nameZH: '博士', nameEN: 'Scholar' },
    { key: 'lishiAdj', nameZH: '力士', nameEN: 'Strongman' },
    { key: 'qinglongAdj', nameZH: '青龙', nameEN: 'Azure Dragon' },
    { key: 'xiaohaoAdj', nameZH: '小耗', nameEN: 'Small Loss' },
    { key: 'jiangjunAdj', nameZH: '将军', nameEN: 'General' },
    { key: 'zuoqiAdj', nameZH: '奏书', nameEN: 'Memorial' },
    { key: 'feilianAdj', nameZH: '飞廉', nameEN: 'Flying Slander' },
    { key: 'xishenAdj', nameZH: '喜神', nameEN: 'Joy God' },
    { key: 'bingfuAdj', nameZH: '病符', nameEN: 'Sickness' },
    { key: 'dahaoAdj', nameZH: '大耗', nameEN: 'Great Loss' },
    { key: 'fubingAdj', nameZH: '伏兵', nameEN: 'Ambush' },
    { key: 'guanfuAdj', nameZH: '官府', nameEN: 'Government' },
    { key: 'shengongAdj', nameZH: '蜚廉', nameEN: 'Slander' },
    { key: 'bohuAdj', nameZH: '白虎', nameEN: 'White Tiger' },
    { key: 'diaokeAdj', nameZH: '吊客', nameEN: 'Mourner' },
  ],
  changsheng12: [
    { key: 'changsheng', nameZH: '长生' },
    { key: 'muyu', nameZH: '沐浴' },
    { key: 'guandai', nameZH: '冠带' },
    { key: 'lingguan', nameZH: '临官' },
    { key: 'diwang', nameZH: '帝旺' },
    { key: 'shuai', nameZH: '衰' },
    { key: 'bing', nameZH: '病' },
    { key: 'si', nameZH: '死' },
    { key: 'mu', nameZH: '墓' },
    { key: 'jue', nameZH: '绝' },
    { key: 'tai', nameZH: '胎' },
    { key: 'yang', nameZH: '养' },
  ],
};

/** 宫位名称（按 FirePalace 顺序：从寅开始，命宫为索引 0） */
const PALACE_NAMES = [
  { index: 0, key: PALACES[0], nameZH: '命宫', description: '本命宫位，代表自身、性格、运势' },
  { index: 1, key: PALACES[1], nameZH: '父母', description: '父母宫，代表父母、长辈' },
  { index: 2, key: PALACES[2], nameZH: '福德', description: '福德宫，代表精神、享受' },
  { index: 3, key: PALACES[3], nameZH: '田宅', description: '田宅宫，代表房产、家庭' },
  { index: 4, key: PALACES[4], nameZH: '官禄', description: '官禄宫，代表事业、工作' },
  { index: 5, key: PALACES[5], nameZH: '交友', description: '交友宫，代表人脉、朋友' },
  { index: 6, key: PALACES[6], nameZH: '迁移', description: '迁移宫，代表外出、变动' },
  { index: 7, key: PALACES[7], nameZH: '疾厄', description: '疾厄宫，代表健康、疾病' },
  { index: 8, key: PALACES[8], nameZH: '财帛', description: '财帛宫，代表财运、物质' },
  { index: 9, key: PALACES[9], nameZH: '子女', description: '子女宫，代表子女、晚辈' },
  { index: 10, key: PALACES[10], nameZH: '夫妻', description: '夫妻宫，代表配偶、婚姻' },
  { index: 11, key: PALACES[11], nameZH: '兄弟', description: '兄弟宫，代表兄弟姐妹' },
  { index: 12, key: 'bodyPalace', nameZH: '身宫', description: '身宫，代表后天运势侧重' },
];

/** 天干列表 */
const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

/** 地支列表 */
const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

/** 时辰对照表 */
const TIME_PERIODS = [
  { index: 0, chineseKey: CHINESE_TIME[0], chineseName: '早子时', timeRange: TIME_RANGE[0], earthlyBranch: '子' },
  { index: 1, chineseKey: CHINESE_TIME[1], chineseName: '丑时', timeRange: TIME_RANGE[1], earthlyBranch: '丑' },
  { index: 2, chineseKey: CHINESE_TIME[2], chineseName: '寅时', timeRange: TIME_RANGE[2], earthlyBranch: '寅' },
  { index: 3, chineseKey: CHINESE_TIME[3], chineseName: '卯时', timeRange: TIME_RANGE[3], earthlyBranch: '卯' },
  { index: 4, chineseKey: CHINESE_TIME[4], chineseName: '辰时', timeRange: TIME_RANGE[4], earthlyBranch: '辰' },
  { index: 5, chineseKey: CHINESE_TIME[5], chineseName: '巳时', timeRange: TIME_RANGE[5], earthlyBranch: '巳' },
  { index: 6, chineseKey: CHINESE_TIME[6], chineseName: '午时', timeRange: TIME_RANGE[6], earthlyBranch: '午' },
  { index: 7, chineseKey: CHINESE_TIME[7], chineseName: '未时', timeRange: TIME_RANGE[7], earthlyBranch: '未' },
  { index: 8, chineseKey: CHINESE_TIME[8], chineseName: '申时', timeRange: TIME_RANGE[8], earthlyBranch: '申' },
  { index: 9, chineseKey: CHINESE_TIME[9], chineseName: '酉时', timeRange: TIME_RANGE[9], earthlyBranch: '酉' },
  { index: 10, chineseKey: CHINESE_TIME[10], chineseName: '戌时', timeRange: TIME_RANGE[10], earthlyBranch: '戌' },
  { index: 11, chineseKey: CHINESE_TIME[11], chineseName: '亥时', timeRange: TIME_RANGE[11], earthlyBranch: '亥' },
  { index: 12, chineseKey: CHINESE_TIME[12], chineseName: '晚子时', timeRange: TIME_RANGE[12], earthlyBranch: '子' },
];

/** 配置参考 */
const CONFIG_REFERENCE = {
  yearDivide: {
    description: '年分割点：决定年份以正月初一还是立春为分界',
    options: [
      { value: 'normal', label: '正月初一分界（默认）' },
      { value: 'exact', label: '立春分界' },
    ],
  },
  horoscopeDivide: {
    description: '运限分割点：决定运限月份以初一还是节气为分界',
    options: [
      { value: 'normal', label: '初一分界（默认）' },
      { value: 'exact', label: '节气分界' },
    ],
  },
  ageDivide: {
    description: '小限分割点：决定年龄以自然年还是生日为分界',
    options: [
      { value: 'normal', label: '自然年分界（默认）' },
      { value: 'birthday', label: '生日分界' },
    ],
  },
  dayDivide: {
    description: '晚子时处理：决定23点后算当日还是次日',
    options: [
      { value: 'current', label: '算当日' },
      { value: 'forward', label: '算来日（默认）' },
    ],
  },
  algorithm: {
    description: '安星算法：决定星耀排布算法',
    options: [
      { value: 'default', label: '通用版本（默认）' },
      { value: 'zhongzhou', label: '中州派版本' },
    ],
  },
};

/** 所有 Resource 定义 */
export const RESOURCES = [
 // ─── 合盘知识库 Resources ──────────────────────────────
 {
   name: 'stars-in-fuqi-gu' as const,
   uri: 'iztro://heming/stars-in-fuqi-gu' as const,
   description:
     '紫微斗数合盘知识库：十四主星（紫微、天机、太阳、武曲、天同、廉贞、天府、太阴、贪狼、巨门、天相、天梁、七杀、破军）在夫妻宫的完整断语。' +
     '每颗星包含：核心总结(summary)、吉象条件(good)、凶象注意事项(bad)、配偶外形性格(spouseTraits)、婚期建议(timing)、倪海夏原话(niQuote)。' +
     '当进行合盘分析需要解读某颗星在夫妻宫的含义时，应查阅此资源。可通过 get_heming_star 工具按星名查询单条，也可直接读取本资源获取全部。',
   mimeType: 'application/json' as const,
   data: STAR_IN_FUQI_GU,
 },
 {
   name: 'sihua-in-fuqi-gu' as const,
   uri: 'iztro://heming/sihua-in-fuqi-gu' as const,
   description:
     '紫微斗数合盘知识库：四化（化禄、化权、化科、化忌）在夫妻宫的完整断语。' +
     '化禄主缘分深厚配偶带财，化权主婚姻主动争取配偶掌权，化科主和谐相处贵人缘，化忌主婚姻债务早婚早离。' +
     '当合盘分析需要判断夫妻宫四化的具体含义时，应查阅此资源。',
   mimeType: 'application/json' as const,
   data: SIHUA_IN_FUQI_GU,
 },
 {
   name: 'heming-methodology' as const,
   uri: 'iztro://heming/methodology' as const,
   description:
     '紫微斗数合盘核心方法论（倪海夏体系 + 《紫微斗数全书》综合），是进行任何合盘分析前必读的权威指南。' +
     '包含：双宫联参原则（夫妻宫+福德宫）、天作之合判断标准、完整合盘五步法、缘分类型判断（化禄/权/科/忌引动）、' +
     '婚期判断三层法（本命/大限/流年）、克夫克妻标志、事业合作合盘、命格兼容性速判表、倪海夏核心名言汇总。' +
     '当需要了解合盘分析的整体框架、评分逻辑或方法论依据时，应查阅此资源。',
   mimeType: 'text/plain' as const,
   data: HEMING_METHODOLOGY,
 },
 {
   name: 'marriage-stars-brief' as const,
   uri: 'iztro://heming/marriage-stars-brief' as const,
   description:
     '紫微斗数合盘知识库：婚姻相关杂曜（红鸾、天喜、天姚、咸池、孤辰、寡宿、天哭、天虚、天巫）的简要断语。' +
     '红鸾天喜主婚恋正缘与喜事，天姚咸池主桃花与感情机遇，孤辰寡宿主孤克与缘浅，天哭天虚主刑伤与虚耗，天巫主晚婚与宗教缘。' +
     '当合盘分析需要判断杂曜对婚姻的影响时，应查阅此资源。',
   mimeType: 'application/json' as const,
   data: MARRIAGE_STARS_BRIEF,
 },
 {
   name: 'heming-score-criteria' as const,
   uri: 'iztro://heming/score-criteria' as const,
   description:
     '紫微斗数合盘评分标准（一星至五星），定义各等级合盘质量的判断依据。' +
     '五星(天作之合)：双方夫妻宫互映+四化互补+大限同步+福德双吉；' +
     '四星(良缘)：一方夫妻宫对应对方命宫+四化以禄科为主；' +
     '三星(可配)：命格相配各有棱角需磨合；二星(有险)：夫妻宫各有煞星+化忌有冲；' +
     '一星(高危)：凶星汇聚或廉贞三凶组合。' +
     '当需要理解合盘评分等级的含义或向用户解释评分依据时，应查阅此资源。',
   mimeType: 'application/json' as const,
   data: HEMING_SCORE_CRITERIA,
 },
 {
   name: 'heming-compatibility' as const,
   uri: 'iztro://heming/compatibility' as const,
   description:
     '紫微斗数合盘知识库：命格兼容性速判表，列出十四主星两两组合的兼容性星级（1-5星）和详细说明。' +
     '包含18种典型组合如：紫微+天府(★★★★★帝星遇财库)、天相+任意(★★★★印星佐才)、' +
     '七杀+七杀(★★两虎相争)、廉贞+七杀/破军(★三凶组合生离死别风险最高)等。' +
     '当合盘分析需要快速判断双方命宫主星的兼容性时，应查阅此资源。',
   mimeType: 'application/json' as const,
   data: MAP_COMPATIBILITY,
 },
  {
    name: 'stars-catalog' as const,
    uri: 'iztro://constants/stars' as const,
    description: '紫微斗数所有星耀的完整目录，包括主星、辅星、杂耀、长生十二神等',
    mimeType: 'application/json' as const,
    data: STAR_CATALOG,
  },
  {
    name: 'palace-names' as const,
    uri: 'iztro://constants/palace-names' as const,
    description: '紫微斗数十二宫加身宫的名称、索引和描述',
    mimeType: 'application/json' as const,
    data: PALACE_NAMES,
  },
  {
    name: 'heavenly-stems' as const,
    uri: 'iztro://constants/heavenly-stems' as const,
    description: '十天干列表：甲、乙、丙、丁、戊、己、庚、辛、壬、癸',
    mimeType: 'application/json' as const,
    data: STEMS.map((stem, index) => ({ index, name: stem, key: HEAVENLY_STEMS[index] })),
  },
  {
    name: 'earthly-branches' as const,
    uri: 'iztro://constants/earthly-branches' as const,
    description: '十二地支列表：子、丑、寅、卯、辰、巳、午、未、申、酉、戌、亥',
    mimeType: 'application/json' as const,
    data: BRANCHES.map((branch, index) => ({ index, name: branch, key: EARTHLY_BRANCHES[index] })),
  },
  {
    name: 'time-periods' as const,
    uri: 'iztro://constants/time-periods' as const,
    description: '时辰索引、名称与时间段对照表：0=早子时(00:00~01:00) ... 12=晚子时(23:00~00:00)',
    mimeType: 'application/json' as const,
    data: TIME_PERIODS,
  },
  {
    name: 'languages' as const,
    uri: 'iztro://constants/languages' as const,
    description: 'iztro 支持的多语言列表',
    mimeType: 'application/json' as const,
    data: LANGUAGES.map((lang) => {
      const LABELS: Record<string, string> = {
        'zh-CN': '简体中文',
        'zh-TW': '繁體中文',
        'en-US': 'English',
        'ja-JP': '日本語',
        'ko-KR': '한국어',
        'vi-VN': 'Tiếng Việt',
      };

      return { code: lang, label: LABELS[lang] ?? lang };
    }),
  },
  {
    name: 'config-reference' as const,
    uri: 'iztro://constants/config-reference' as const,
    description: 'iztro 全局配置参数参考，包括 yearDivide、horoscopeDivide、ageDivide、dayDivide、algorithm 的说明和可选值',
    mimeType: 'application/json' as const,
    data: CONFIG_REFERENCE,
  },
  {
    name: 'patterns-knowledge' as const,
    uri: 'iztro://patterns/knowledge' as const,
    description:
      '紫微斗数格局知识库（完整41个格局）。按分类分组：上格(8个：君臣庆会、紫府同宫、府相朝垣、阳梁昌禄、火贪格/铃贪格、武贪格、杀破狼、机月同梁)、' +
      '中格(9个：廉贞天相、武曲七杀、天同天梁、日月同宫、日月夹命、巨日同宫、石中隐玉、明珠出海、紫微入命)、' +
      '助力格(6个)、恶格(8个)、基础格(10个)。每个格局包含：名称、分类、级别(excellent/good/neutral/caution)、详细描述、古籍出处、典型条件。' +
      '当需要了解格局的详细含义、古籍依据或为用户解读格局时，应查阅此资源。可通过 get_patterns 工具检测命盘中的格局，再查阅本资源获取每个格局的完整知识卡片。',
    mimeType: 'application/json' as const,
    data: PATTERNS_KNOWLEDGE,
  },
];
