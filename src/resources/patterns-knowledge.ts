/**
 * 紫微斗数格局知识库 — 全部 41 个格局的静态知识卡片
 *
 * 分类：上格(8) / 中格(9) / 助力格(6) / 恶格(8) / 基础格(10)
 * 来源：《紫微斗数全书》《紫微斗数全集》《骨髓赋》及倪海厦《天纪》
 */

export interface PatternKnowledge {
  name: string;
  category: 'superior' | 'middle' | 'support' | 'caution' | 'basic';
  level: 'excellent' | 'good' | 'neutral' | 'caution';
  description: string;
  source: string;
  typicalConditions: string[];
}

/** ─── 上格 (8) ─── */
const SUPERIOR_PATTERNS: PatternKnowledge[] = [
  {
    name: '君臣庆会',
    category: 'superior',
    level: 'excellent',
    description: '紫微入命，左辅右弼同会，帝王得贤臣辅佐，主大富大贵、统御之命。一生贵人不绝，宜走政商高位、跨界领袖之途。',
    source: '《紫微斗数全书·君臣庆会格》',
    typicalConditions: ['紫微入命', '左辅右弼同会三方四正'],
  },
  {
    name: '紫府同宫',
    category: 'superior',
    level: 'excellent',
    description: '紫微天府同入命宫，帝相并临，尊贵之命。主品行端正、衣食无忧、有领导才能，宜担任要职。需要左右辅弼来配合方为完整大格。',
    source: '《紫微斗数全书·紫府同宫格》',
    typicalConditions: ['紫微天府同宫（寅/申）', '命宫或会照'],
  },
  {
    name: '府相朝垣',
    category: 'superior',
    level: 'excellent',
    description: '天府天相分守命宫三方四正，文武并济、权印双辉，主一生衣食丰足、地位崇高。古书云"府相朝垣千钟食禄"，常见于政界、企业管理者。',
    source: '《紫微斗数全书·府相朝垣格》',
    typicalConditions: ['天府坐命三方', '天相坐命三方', '两星不同宫'],
  },
  {
    name: '阳梁昌禄',
    category: 'superior',
    level: 'excellent',
    description: '太阳、天梁、文昌、禄存四星齐会命宫三方，号称"科举之星"，主清贵显达、考运极佳，宜走学术、文教、研究、专业认证之路，一生功名易就。',
    source: '《紫微斗数全书·阳梁昌禄格》',
    typicalConditions: ['太阳会命宫三方', '天梁会命宫三方', '文昌会命宫三方', '禄存会命宫三方'],
  },
  {
    name: '火贪格 / 铃贪格',
    category: 'superior',
    level: 'excellent',
    description: '贪狼遇火星或铃星同宫或三方会照，主突发横财、突如其来的机遇。古书云"贪狼遇火铃，必发横财"，但来得快去得也快，宜见好就收。',
    source: '《紫微斗数骨髓赋》',
    typicalConditions: ['贪狼会照命宫三方', '火星或铃星会照贪狼宫'],
  },
  {
    name: '武贪格',
    category: 'superior',
    level: 'excellent',
    description: '武曲贪狼会命，财星与桃花欲望星交辉，古书云"武贪不发少年人"——三十岁后方能厚积薄发。主中年以后大富大贵，适合金融、投机、销售、娱乐业。',
    source: '《紫微斗数骨髓赋》',
    typicalConditions: ['武曲贪狼同宫（丑/未）或对拱', '会照命宫三方'],
  },
  {
    name: '杀破狼',
    category: 'superior',
    level: 'good',
    description: '七杀、破军、贪狼三星会命，开创闯荡之命格。一生变动多、不甘平凡，宜创业、军警、业务、销售。中年后才能稳定守成，年轻时易因冲动失利。',
    source: '《紫微斗数全书·杀破狼》',
    typicalConditions: ['七杀、破军、贪狼三星齐入命宫三方四正'],
  },
  {
    name: '机月同梁',
    category: 'superior',
    level: 'excellent',
    description: '天机太阴天同天梁四星齐入命迁财官，文质彬彬、聪慧善谋。最适合公职、学术、文艺、医疗、服务等需稳定累积的行业，不宜大冒险大投机。',
    source: '《紫微斗数全书·机月同梁格》',
    typicalConditions: ['天机、太阴、天同、天梁四星齐入命宫三方四正'],
  },
];

/** ─── 中格 (9) ─── */
const MIDDLE_PATTERNS: PatternKnowledge[] = [
  {
    name: '廉贞天相格',
    category: 'middle',
    level: 'good',
    description: '廉贞天相同宫，印绶格局，主秉公处事、清廉之名，宜任公职、行政管理、法务、企划。怕见擎羊化忌，则反主官非。',
    source: '《紫微斗数全书》',
    typicalConditions: ['廉贞天相同宫'],
  },
  {
    name: '武曲七杀',
    category: 'middle',
    level: 'excellent',
    description: '武曲七杀同宫，将星配财星，主果决刚毅、理财能力强，适合金融、军警、创业。但忌见化忌煞星，否则凶险。一生奋斗、积财但操心。',
    source: '《紫微斗数全书》',
    typicalConditions: ['武曲七杀同宫'],
  },
  {
    name: '天同天梁格',
    category: 'middle',
    level: 'good',
    description: '天同天梁同宫，福星与荫星共会，主宽厚和善、乐于助人，宜医疗、教育、宗教、社会公益。但偏温和保守，难成大富大贵之局。',
    source: '《紫微斗数全书》',
    typicalConditions: ['天同天梁同宫'],
  },
  {
    name: '日月同宫',
    category: 'middle',
    level: 'excellent',
    description: '太阳太阴同宫（丑/未），阴阳平衡，文武兼备。主异性缘佳、事业顺遂、名声远播。未宫日月双美尤佳。',
    source: '《紫微斗数全书》',
    typicalConditions: ['太阳太阴同入丑或未宫'],
  },
  {
    name: '日月夹命',
    category: 'middle',
    level: 'excellent',
    description: '太阳太阴分居命宫两侧夹照，光明磊落，一生贵人相助，事业蓬勃。男主官贵，女主旺夫兴家。日月须不落陷方为真夹。',
    source: '《紫微斗数全书·日月夹命》',
    typicalConditions: ['太阳太阴分居命宫前后两宫'],
  },
  {
    name: '巨日同宫',
    category: 'middle',
    level: 'good',
    description: '巨门太阳同宫（寅/申），太阳化解巨门暗曜，主以口才、传媒、外语、专业立业。寅宫为佳，申宫力减。怕巨门化忌则官非。',
    source: '《紫微斗数全书·巨日同宫》',
    typicalConditions: ['巨门太阳同入寅或申宫'],
  },
  {
    name: '石中隐玉',
    category: 'middle',
    level: 'excellent',
    description: '巨门坐命子午，外表平凡而内蕴才学。早年默默无闻、中年方显贵气，宜走专业、研究、口才、传媒。需有禄权或文昌相助方能"凿石见玉"。',
    source: '《紫微斗数骨髓赋·石中隐玉》',
    typicalConditions: ['巨门入命于子或午宫'],
  },
  {
    name: '明珠出海',
    category: 'middle',
    level: 'excellent',
    description: '命未空宫，对宫丑宫日月同辉拱照，号"明珠出海"。主出生平凡、后天努力出头，宜远赴他乡、学术研究或大公司高位，主大富大贵。',
    source: '《紫微斗数全集·明珠出海》',
    typicalConditions: ['命宫在未为空宫', '对宫丑宫为太阳太阴同度'],
  },
  {
    name: '紫微入命',
    category: 'middle',
    level: 'good',
    description: '紫微独坐命宫，帝王之星，自尊心强、有领导魅力。但紫微最忌"在野孤君"——若无左右辅弼相会，反成孤高自傲、易招毁谤。',
    source: '《紫微斗数全书》',
    typicalConditions: ['紫微独坐命宫（无天府同坐）'],
  },
];

/** ─── 助力格 (6) ─── */
const SUPPORT_PATTERNS: PatternKnowledge[] = [
  {
    name: '辅弼夹命',
    category: 'support',
    level: 'excellent',
    description: '左辅右弼夹命，一生贵人不断、逢凶化吉。适合走仕途、大企业管理，有贵人提携之命。古书云"左辅右弼，终身福厚"。',
    source: '《紫微斗数全书·辅弼夹命》',
    typicalConditions: ['左辅右弼分居命宫前后两宫'],
  },
  {
    name: '昌曲夹命',
    category: 'support',
    level: 'excellent',
    description: '文昌文曲夹命宫，主聪明俊秀、文采斐然，宜走文教、学术、艺术、写作。古书云"昌曲夹命主科甲"，最利考运。',
    source: '《紫微斗数全书》',
    typicalConditions: ['文昌文曲分居命宫前后两宫'],
  },
  {
    name: '魁钺夹命',
    category: 'support',
    level: 'good',
    description: '天魁天钺夹命，男称天乙、女称玉堂，一生贵人提携。考试、求职、关键时刻常有意外贵人相助。',
    source: '《紫微斗数全书》',
    typicalConditions: ['天魁天钺分居命宫前后两宫'],
  },
  {
    name: '双禄朝垣',
    category: 'support',
    level: 'excellent',
    description: '化禄、禄存同会命宫三方四正，财源涌动、衣食丰足。古书云"双禄朝垣，富比陶朱"，主一生不愁财，多有正财横财兼得。',
    source: '《紫微斗数全书·双禄朝垣》',
    typicalConditions: ['化禄会照三方四正', '禄存会照三方四正'],
  },
  {
    name: '三奇加会',
    category: 'support',
    level: 'excellent',
    description: '化禄、化权、化科三吉化齐会命宫三方四正，号称"三奇加会"。主一生功名、财富、贵人三全，是紫微斗数最高吉格之一。',
    source: '《紫微斗数全书·三奇加会》',
    typicalConditions: ['化禄、化权、化科三吉化齐会命宫三方四正'],
  },
  {
    name: '化禄入命',
    category: 'support',
    level: 'good',
    description: '主星化禄坐命，主生财顺利、人缘佳、机缘多。不同主星化禄代表不同财富来源。',
    source: '《紫微斗数全书》',
    typicalConditions: ['主星化禄坐命宫'],
  },
];

/** ─── 恶格 (8) ─── */
const CAUTION_PATTERNS: PatternKnowledge[] = [
  {
    name: '化忌入命/迁',
    category: 'caution',
    level: 'caution',
    description: '主星化忌坐命宫或迁移宫。化忌不一定坏，代表此星能量需要特别关注。命宫需留意自身固执、心理障碍或健康隐患；迁移宫则外出、远行、人际关系易有波折。',
    source: '《紫微斗数全书》',
    typicalConditions: ['主星化忌坐命宫或迁移宫'],
  },
  {
    name: '羊陀夹忌',
    category: 'caution',
    level: 'caution',
    description: '化忌坐命，左右擎羊陀罗夹命，古书云"羊陀夹忌为败局"，主一生劳碌奔波、坎坷不顺、身心俱疲。需以德行修养与积极做事化解，凡事谨慎为上。',
    source: '《紫微斗数骨髓赋·羊陀夹忌》',
    typicalConditions: ['化忌坐命', '擎羊陀罗分居命宫前后两宫'],
  },
  {
    name: '火铃夹命',
    category: 'caution',
    level: 'caution',
    description: '火星铃星分居命宫前后两宫夹命，主性急、易冲动、突发意外或纠纷。需培养耐性、避免冲动决策。',
    source: '《紫微斗数全书》',
    typicalConditions: ['火星铃星分居命宫前后两宫'],
  },
  {
    name: '空劫夹命',
    category: 'caution',
    level: 'caution',
    description: '地空地劫夹命，主财来财去、思想脱俗、易遁入宗教哲学。古书云"空劫夹命，财不聚"。宜技艺、宗教、研究等不重物质之业。',
    source: '《紫微斗数全书》',
    typicalConditions: ['地空地劫分居命宫前后两宫'],
  },
  {
    name: '廉杀羊',
    category: 'caution',
    level: 'caution',
    description: '廉贞、七杀、擎羊三星会照命宫三方，古书警示之凶格。主血光、官非、意外。本命有此格不必惊慌，但流年大限再触发时需特别谨慎驾驶、避免冲突、注意手术风险。',
    source: '《紫微斗数全书·廉杀羊》',
    typicalConditions: ['廉贞、七杀、擎羊三星会照三方四正'],
  },
  {
    name: '巨火羊',
    category: 'caution',
    level: 'caution',
    description: '巨门、火星、擎羊三星会照，古书云"巨火羊，终身缢死"——古时凶格。现代理解为：易因口舌、激烈冲突而招大祸。需修身养性、慎言慎行，避免极端情绪。',
    source: '《紫微斗数骨髓赋·巨火羊》',
    typicalConditions: ['巨门、火星、擎羊三星会照三方四正'],
  },
  {
    name: '铃昌陀武',
    category: 'caution',
    level: 'caution',
    description: '铃星、文昌、陀罗、武曲四星齐会，古书云"铃昌陀武，限至投河"——古时大凶格。本命有此组合本身不必恐慌，但流年大限触发时需高度警觉重大决策、情绪起伏、水边活动。',
    source: '《紫微斗数骨髓赋·铃昌陀武》',
    typicalConditions: ['铃星、文昌、陀罗、武曲四星会照三方四正'],
  },
  {
    name: '马头带箭',
    category: 'caution',
    level: 'caution',
    description: '擎羊于午宫坐命，号"马头带箭"。古书云"威镇边疆"——主刚毅果决、有冲杀之力，宜军警武职、运动员、外科医师。但同时也主危险与意外，需配合杀破狼或贵人方为大格。',
    source: '《紫微斗数骨髓赋·马头带箭》',
    typicalConditions: ['擎羊于午宫坐命'],
  },
];

/** ─── 基础格 (10) ─── */
const BASIC_PATTERNS: PatternKnowledge[] = [
  {
    name: '禄存守命/守身',
    category: 'basic',
    level: 'good',
    description: '禄存坐命或身宫，主一生衣食无忧、财禄稳定。性格保守，善积累，但羊陀夹禄须防小人。最宜配化禄、左辅右弼方为大格。',
    source: '《紫微斗数全书·禄存星》',
    typicalConditions: ['禄存入命宫或身宫'],
  },
  {
    name: '天马入命/在迁',
    category: 'basic',
    level: 'neutral',
    description: '天马入命或迁移宫，主一生奔波、动中得财，宜走商旅、外勤、跨界发展。再会禄存或化禄即"禄马交驰"之富格。',
    source: '《紫微斗数全书·天马星》',
    typicalConditions: ['天马入命宫或迁移宫'],
  },
  {
    name: '化禄入财',
    category: 'basic',
    level: 'good',
    description: '主星化禄入财帛宫，主财源畅通、收入稳定。这个化禄星所代表的能力是你赚钱的主轴。配禄存或天马则财源更广。',
    source: '《紫微斗数全书·四化论》',
    typicalConditions: ['主星化禄入财帛宫'],
  },
  {
    name: '化权入官',
    category: 'basic',
    level: 'good',
    description: '主星化权入官禄宫，主事业有掌控力、能担当独当一面的职位。化权代表权力与执行力，说明在事业上能成为决策者或核心执行者，宜走管理或技术权威路线。',
    source: '《紫微斗数全书·四化论》',
    typicalConditions: ['主星化权入官禄宫'],
  },
  {
    name: '化科入命/入身',
    category: 'basic',
    level: 'good',
    description: '主星化科入命或身宫，主名声、文书、学术运。化科是"贵人星"——带来的是被人看重的特质，宜从事文书、教育、研究、咨询、文创等"以名取利"的方向。',
    source: '《紫微斗数全书·四化论》',
    typicalConditions: ['主星化科入命宫或身宫'],
  },
  {
    name: '机月同梁三星会',
    category: 'basic',
    level: 'neutral',
    description: '三方四正会齐天机/太阴/天同/天梁中的三颗，差一颗未会。机月同梁不全格，文质带谋，但稳定度不如四星齐。仍宜公职、教研、医疗、服务等需要积累与稳定的行业。',
    source: '《紫微斗数全书·机月同梁格》（降级版）',
    typicalConditions: ['三方四正会天机/太阴/天同/天梁中任意三颗'],
  },
  {
    name: '昌曲同会 / 昌曲坐命',
    category: 'basic',
    level: 'good',
    description: '文昌文曲同会命宫三方四正，主才华横溢、口才文笔俱佳。宜走需要表达与文采的行业，化科加持则名声大显。若同入命宫则更佳。',
    source: '《紫微斗数全书·文星论》',
    typicalConditions: ['文昌、文曲同会命宫三方四正'],
  },
  {
    name: '辅弼同会',
    category: 'basic',
    level: 'good',
    description: '左辅右弼同会命宫三方四正，主一生贵人不绝、人缘极佳。最宜领导岗位与团队合作型工作。倪师说"辅弼夹命，平生贵人多"——不是单打独斗的命，要善用人际网络。',
    source: '《紫微斗数全书·辅弼论》',
    typicalConditions: ['左辅、右弼同会命宫三方四正'],
  },
  {
    name: '魁钺同会',
    category: 'basic',
    level: 'good',
    description: '天魁天钺同会命宫三方四正，主"天乙贵人"加持，关键时刻总有贵人提携。遇到困难时身边会出现得力相助者，宜主动维护人脉。',
    source: '《紫微斗数全书·魁钺论》',
    typicalConditions: ['天魁、天钺同会命宫三方四正'],
  },
  {
    name: '科权双会',
    category: 'basic',
    level: 'good',
    description: '化科 + 化权 同会三方四正，主名权双美——既有学识/名声（科），又有掌控力（权），宜走"专业权威"路线（如医生、律师、教授、技术骨干），名利双收且根基扎实。',
    source: '《紫微斗数全书·四化会照》',
    typicalConditions: ['化科、化权同会命宫三方四正'],
  },
];

/** 全部 41 个格局知识卡片（按分类分组） */
export const PATTERNS_KNOWLEDGE: Record<string, PatternKnowledge[]> = {
  superior: SUPERIOR_PATTERNS,
  middle: MIDDLE_PATTERNS,
  support: SUPPORT_PATTERNS,
  caution: CAUTION_PATTERNS,
  basic: BASIC_PATTERNS,
};

/** 所有格局扁平列表 */
export const ALL_PATTERNS: PatternKnowledge[] = [
  ...SUPERIOR_PATTERNS,
  ...MIDDLE_PATTERNS,
  ...SUPPORT_PATTERNS,
  ...CAUTION_PATTERNS,
  ...BASIC_PATTERNS,
];
