/**
 * celestine 库适配层
 *
 * 封装 celestine npm 包的调用，将原始数据转换为本项目的类型结构。
 * 所有中文标签映射、日期校验、真太阳时计算均在此层完成。
 *
 * 从 mingyu 项目移植的核心函数：
 * - generateWesternAstrolabe() — 本命盘生成 (celestine calculateChart)
 * - generateWesternScope() — 行运分析 (celestine calculateTransits + calculatePlanets)
 */
import {
  AspectType,
  CelestialBody,
  calculateChart,
  calculatePlanets,
  calculateProgression,
  calculateTransits,
  time,
  type ChartPlanet,
  type NatalPoint,
  type ProgressedAspect,
  type ProgressedChart,
  type ProgressedPlanet,
  type ProgressionBirthData,
  type Transit,
} from 'celestine';
import { convertToSolarTime } from '../utils/solar-time.js';
import type {
  WesternAstrolabeOptions,
  WesternScopeOptions,
  WesternAstrolabePoint,
  WesternAstrolabeAspect,
  WesternAstrolabeData,
  WesternBirthInfo,
  WesternChartSummary,
  WesternTransitAspect,
  WesternTransitHouse,
  WesternScopeData,
  WesternNatalSummary,
} from '../schemas/western-astrolabe.js';

// ============================================================================
// 中文标签映射常量
// ============================================================================

/** 行星英文名 → 中文标签 */
const PLANET_LABELS: Record<string, string> = {
  Sun: '太阳',
  Moon: '月亮',
  Mercury: '水星',
  Venus: '金星',
  Mars: '火星',
  Jupiter: '木星',
  Saturn: '土星',
  Uranus: '天王星',
  Neptune: '海王星',
  Pluto: '冥王星',
};

/** 四轴点英文名 → 中文标签 */
const ANGLE_LABELS: Record<string, string> = {
  Ascendant: '上升',
  Midheaven: '天顶',
  Descendant: '下降',
  'Imum Coeli': '天底',
};

/** 星座英文名 → 中文标签 */
const SIGN_LABELS: Record<string, string> = {
  Aries: '白羊座',
  Taurus: '金牛座',
  Gemini: '双子座',
  Cancer: '巨蟹座',
  Leo: '狮子座',
  Virgo: '处女座',
  Libra: '天秤座',
  Scorpio: '天蝎座',
  Sagittarius: '射手座',
  Capricorn: '摩羯座',
  Aquarius: '水瓶座',
  Pisces: '双鱼座',
};

/** 相位类型英文名 → 中文标签 */
const ASPECT_LABELS: Record<string, string> = {
  conjunction: '合相',
  sextile: '六合',
  square: '刑相',
  trine: '拱相',
  opposition: '冲相',
};

/** 宫主星映射表：星座中文名 → 主星 + 现代辅星 */
const HOUSE_RULER_MAP: Record<string, { primary: string; modern?: string }> = {
  白羊座: { primary: 'Mars' },
  金牛座: { primary: 'Venus' },
  双子座: { primary: 'Mercury' },
  巨蟹座: { primary: 'Moon' },
  狮子座: { primary: 'Sun' },
  处女座: { primary: 'Mercury' },
  天秤座: { primary: 'Venus' },
  天蝎座: { primary: 'Mars', modern: 'Pluto' },
  射手座: { primary: 'Jupiter' },
  摩羯座: { primary: 'Saturn' },
  水瓶座: { primary: 'Saturn', modern: 'Uranus' },
  双鱼座: { primary: 'Jupiter', modern: 'Neptune' },
};

/** 行运相位阶段标签 */
const PHASE_LABELS: Record<string, string> = {
  applying: '入相',
  exact: '精准',
  separating: '出相',
};

/** 所有天体中英文映射（用于行运，包含轴点） */
const NATAL_POINT_NAME_MAP: Record<string, string> = {
  Sun: '太阳',
  Moon: '月亮',
  Mercury: '水星',
  Venus: '金星',
  Mars: '火星',
  Jupiter: '木星',
  Saturn: '土星',
  Uranus: '天王星',
  Neptune: '海王星',
  Pluto: '冥王星',
  Ascendant: '上升',
  Midheaven: '天顶',
  Descendant: '下降',
  'Imum Coeli': '天底',
};

/** 行运计算使用的天体列表（按 mingyu 顺序） */
const TRANSITING_BODIES: CelestialBody[] = [
  CelestialBody.Jupiter,
  CelestialBody.Saturn,
  CelestialBody.Uranus,
  CelestialBody.Neptune,
  CelestialBody.Pluto,
  CelestialBody.Mars,
  CelestialBody.Venus,
  CelestialBody.Mercury,
  CelestialBody.Sun,
  CelestialBody.Moon,
];

/** 允许星盘点位有限经度判断的最小经度 */
const MIN_VALID_LONGITUDE = -360;

/** 技术限制声明 */
const TECH_LIMIT_NOTICE =
  '技术限制：未计算太阳返照、太阳弧、返照宫位、主限或法达，不得把这些未写入的技术当作证据。';

/** 日返盘未实现提示 */
const SOLAR_RETURN_NOTICE =
  '日返盘（Solar Return）功能尚未实现：celestine 库暂不提供日返盘计算 API。请改用 transit（行运）或 secondary_progression（次限推进）进行分析。';

/** 12宫名称映射 */
const HOUSE_NAME_MAP: Record<number, string> = {
  1: '第1宫（命宫）',
  2: '第2宫（财帛宫）',
  3: '第3宫（兄弟宫）',
  4: '第4宫（田宅宫）',
  5: '第5宫（子女宫）',
  6: '第6宫（奴仆宫）',
  7: '第7宫（夫妻宫）',
  8: '第8宫（疾厄宫）',
  9: '第9宫（迁移宫）',
  10: '第10宫（官禄宫）',
  11: '第11宫（福德宫）',
  12: '第12宫（相貌宫）',
};

// ============================================================================
// 日期与数值校验辅助函数
// ============================================================================

/**
 * 计算公历月份的天数
 *
 * @param year 年份 (1900-2100)
 * @param month 月份 (1-12)
 * @returns 该月天数
 * @throws 当年月超出范围时抛出 Error
 */
function daysInSolarMonth(year: number, month: number): number {
  if (!Number.isInteger(year) || year < 1900 || year > 2100) {
    throw new Error('年份需在 1900-2100 之间。');
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error('月份需在 1-12 之间。');
  }
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * 校验公历日期合法性
 *
 * @param year 年份
 * @param month 月份
 * @param day 日期
 * @throws 当日期不合法时抛出 Error
 */
function validateSolarDate(year: number, month: number, day: number): void {
  if (!Number.isInteger(year) || year < 1900 || year > 2100) {
    throw new Error('年份需在 1900-2100 之间。');
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error('月份需在 1-12 之间。');
  }
  const maxDay = daysInSolarMonth(year, month);
  if (!Number.isInteger(day) || day < 1 || day > maxDay) {
    throw new Error(`日期需在 1-${maxDay} 之间。`);
  }
}

/**
 * 校验时间（小时、分钟）在合法范围内
 */
function validateTimePart(hour: number, minute: number): void {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    throw new Error('小时需在 0-23 之间。');
  }
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) {
    throw new Error('分钟需在 0-59 之间。');
  }
}

/**
 * 校验经纬度范围
 */
function validateCoordinate(value: number, label: string, min: number, max: number): void {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new Error(`${label}需在 ${min} 到 ${max} 之间。`);
  }
}

// ============================================================================
// 真太阳时计算
// ============================================================================

/** 日期时间信息 */
interface DateTimeInfo {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

// ============================================================================
// 格式化辅助函数
// ============================================================================

/**
 * 格式化星座位置字符串
 *
 * @param signName 星座英文名
 * @param degree 度数
 * @param minute 分数
 * @returns 如 "金牛座29°08′"
 */
function formatPosition(signName: string, degree: number, minute: number): string {
  return `${SIGN_LABELS[signName] ?? signName}${degree}°${String(minute).padStart(2, '0')}′`;
}

/**
 * 格式化日期时间字符串
 *
 * @param birth 日期时间对象
 * @returns 如 "1990-05-20 09:15"
 */
function formatDateTime(birth: DateTimeInfo): string {
  return `${birth.year}-${String(birth.month).padStart(2, '0')}-${String(birth.day).padStart(2, '0')} ${String(birth.hour).padStart(2, '0')}:${String(birth.minute).padStart(2, '0')}`;
}

// ============================================================================
// 数据映射函数
// ============================================================================

/**
 * 将 celestine 行星数据映射为 AstrolabePoint
 */
function mapPlanet(planet: {
  name: string;
  longitude: number;
  signName: string;
  degree: number;
  minute: number;
  house: number;
  isRetrograde: boolean;
}): WesternAstrolabePoint {
  return {
    name: planet.name,
    label: PLANET_LABELS[planet.name] ?? planet.name,
    longitude: planet.longitude,
    sign: SIGN_LABELS[planet.signName] ?? planet.signName,
    degree: planet.degree,
    minute: planet.minute,
    house: planet.house,
    formatted: formatPosition(planet.signName, planet.degree, planet.minute),
    retrograde: planet.isRetrograde,
  };
}

/**
 * 将 celestine 轴点数据映射为 AstrolabePoint
 */
function mapAngle(angle: {
  name: string;
  longitude: number;
  signName: string;
  degree: number;
  minute: number;
}): WesternAstrolabePoint {
  return {
    name: angle.name,
    label: ANGLE_LABELS[angle.name] ?? angle.name,
    longitude: angle.longitude,
    sign: SIGN_LABELS[angle.signName] ?? angle.signName,
    degree: angle.degree,
    minute: angle.minute,
    house: 0,
    formatted: formatPosition(angle.signName, angle.degree, angle.minute),
  };
}

/**
 * 将 celestine 相位数据映射为 AstrolabeAspect
 */
function mapAspect(aspect: {
  body1: string;
  body2: string;
  type: string;
  symbol: string;
  deviation: number;
  strength: number;
  isApplying: boolean | null;
}): WesternAstrolabeAspect {
  return {
    body1: PLANET_LABELS[aspect.body1] ?? aspect.body1,
    body2: PLANET_LABELS[aspect.body2] ?? aspect.body2,
    type: ASPECT_LABELS[aspect.type] ?? aspect.type,
    symbol: aspect.symbol,
    orb: Number(aspect.deviation.toFixed(2)),
    strength: Math.round(aspect.strength),
    applying: aspect.isApplying,
  };
}

// ============================================================================
// 本命盘宫头与宫位计算
// ============================================================================

/**
 * 获取本命盘12宫宫头经度数组（按宫位索引排序）
 *
 * @returns 12个宫头经度，或 null（数据不足时）
 */
function getNatalHouseCusps(data: WesternAstrolabeData): number[] | null {
  const cusps = data.houses
    .slice()
    .sort((first, second) => first.house - second.house)
    .map((item) => item.longitude);

  return cusps.length === 12 && cusps.every((item) => Number.isFinite(item)) ? cusps : null;
}

/**
 * 将经度归一化到 [0, 360) 范围
 */
function normalizeLongitude(longitude: number): number {
  const normalized = longitude % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

/**
 * 判断经度是否落在 [cusp, nextCusp) 区间内
 */
function isLongitudeInHouse(longitude: number, cusp: number, nextCusp: number): boolean {
  if (nextCusp > cusp) {
    return longitude >= cusp && longitude < nextCusp;
  }
  return longitude >= cusp || longitude < nextCusp;
}

/**
 * 根据黄经确定落入本命第几宫
 *
 * @param longitude 黄经度数
 * @param cusps 12宫宫头经度
 * @returns 宫位索引 (1-12)，或 null
 */
function getNatalHouseByLongitude(longitude: number, cusps: number[]): number | null {
  const normalized = normalizeLongitude(longitude);
  for (let index = 0; index < cusps.length; index += 1) {
    const cusp = normalizeLongitude(cusps[index]);
    const nextCusp = normalizeLongitude(cusps[(index + 1) % cusps.length]);
    if (isLongitudeInHouse(normalized, cusp, nextCusp)) {
      return index + 1;
    }
  }
  return null;
}

// ============================================================================
// 行运辅助函数
// ============================================================================

/**
 * 判断星盘点位是否有有效经度
 */
function hasFiniteLongitude(point: Partial<WesternAstrolabePoint>): boolean {
  return typeof point.longitude === 'number' && Number.isFinite(point.longitude) && point.longitude > MIN_VALID_LONGITUDE;
}

/**
 * 从星盘点位构建 celestine 所需的 NatalPoint
 */
function buildNatalPoint(point: WesternAstrolabePoint): NatalPoint | null {
  if (!hasFiniteLongitude(point)) {
    return null;
  }

  const isAngle =
    point.name === 'Ascendant' ||
    point.name === 'Midheaven' ||
    point.name === 'Descendant' ||
    point.name === 'Imum Coeli';
  const type =
    point.name === 'Sun' || point.name === 'Moon' ? 'luminary' : isAngle ? 'angle' : 'planet';

  return {
    name: point.name,
    longitude: point.longitude,
    type,
    house: point.house || undefined,
  };
}

/** 有效的行星英文名集合 */
const VALID_PLANET_NAMES = new Set([
  'Sun',
  'Moon',
  'Mercury',
  'Venus',
  'Mars',
  'Jupiter',
  'Saturn',
  'Uranus',
  'Neptune',
  'Pluto',
]);

/** 行运计算所需的轴点集合 */
const TRANSIT_ANGLE_NAMES = new Set(['Ascendant', 'Midheaven']);

/**
 * 从本命盘数据提取 celestine 所需的 NatalPoint 列表
 */
function buildNatalPoints(data: WesternAstrolabeData): NatalPoint[] {
  return [
    ...data.planets.filter((item) => VALID_PLANET_NAMES.has(item.name)),
    ...data.angles.filter((item) => TRANSIT_ANGLE_NAMES.has(item.name)),
  ]
    .map(buildNatalPoint)
    .filter((item): item is NatalPoint => Boolean(item));
}

/**
 * 解析出生地坐标
 */
function parseBirthCoordinates(data: WesternAstrolabeData): { latitude: number; longitude: number } {
  const matched = /(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/.exec(data.birth.location);
  if (!matched) {
    return { latitude: 0, longitude: 0 };
  }
  return {
    latitude: Number(matched[1]),
    longitude: Number(matched[2]),
  };
}

/**
 * 格式化星盘中的行星位置字符串
 */
function formatPlanetPosition(planet: Pick<ChartPlanet, 'signName' | 'degree' | 'minute'>): string {
  return `${SIGN_LABELS[planet.signName] ?? planet.signName}${planet.degree}°${String(planet.minute).padStart(2, '0')}′`;
}

// ============================================================================
// 核心导出：本命盘生成
// ============================================================================

/**
 * 生成西方占星本命星盘
 *
 * 调用 celestine calculateChart() 获取原始数据，
 * 映射中文标签、计算元素/模式/逆行/格局摘要。
 *
 * @param input 出生信息输入
 * @returns 完整的西方占星本命星盘数据
 */
export function generateWesternAstrolabe(input: WesternAstrolabeOptions): WesternAstrolabeData {
  validateSolarDate(input.year, input.month, input.day);
  validateTimePart(input.hour, input.minute);
  validateCoordinate(input.latitude, '纬度', -90, 90);
  validateCoordinate(input.longitude, '经度', -180, 180);
  validateCoordinate(input.timezone ?? 8, '时区', -12, 14);

  const standardBirth: DateTimeInfo = {
    year: input.year,
    month: input.month,
    day: input.day,
    hour: input.hour,
    minute: input.minute,
  };

  const birthDate = new Date(input.year, input.month - 1, input.day, input.hour, input.minute);
  let solarDate: Date;
  if (input.longitude != null && input.latitude != null) {
    try {
      solarDate = convertToSolarTime(birthDate, input.longitude, input.latitude ?? 0, true);
    } catch {
      solarDate = new Date(birthDate.getTime());
    }
  } else {
    solarDate = new Date(birthDate.getTime());
  }
  const isSolarTimeCalibrated = solarDate.getTime() !== birthDate.getTime();
  const birth: DateTimeInfo = isSolarTimeCalibrated
    ? {
        year: solarDate.getFullYear(),
        month: solarDate.getMonth() + 1,
        day: solarDate.getDate(),
        hour: solarDate.getHours(),
        minute: solarDate.getMinutes(),
      }
    : standardBirth;

  const chart = calculateChart(
    {
      year: birth.year,
      month: birth.month,
      day: birth.day,
      hour: birth.hour,
      minute: birth.minute,
      second: 0,
      timezone: input.timezone ?? 8,
      latitude: input.latitude,
      longitude: input.longitude,
    },
    {
      houseSystem: 'placidus',
      includeAsteroids: false,
      includeChiron: false,
      includeLilith: false,
      includeNodes: false,
      includeLots: false,
      aspectTypes: [
        AspectType.Conjunction,
        AspectType.Sextile,
        AspectType.Square,
        AspectType.Trine,
        AspectType.Opposition,
      ],
      minimumAspectStrength: 30,
    },
  );

  const formattedSolarTime = isSolarTimeCalibrated
    ? formatDateTime(birth)
    : undefined;

  const birthInfo: WesternBirthInfo = {
    name: input.name?.trim() || '未命名',
    gender: input.gender ?? '',
    dateTime: formatDateTime(birth),
    location: input.locationName?.trim()
      ? `${input.locationName.trim()}（${input.latitude.toFixed(4)}, ${input.longitude.toFixed(4)}）`
      : `${input.latitude.toFixed(4)}, ${input.longitude.toFixed(4)}`,
    timezone: input.timezone ?? 8,
    standardDateTime: formatDateTime(standardBirth),
    trueSolarDateTime: formattedSolarTime,
    isTrueSolarTime: isSolarTimeCalibrated,
    solar_time: formattedSolarTime,
  };

  const planets: WesternAstrolabePoint[] = chart.planets.slice(0, 10).map(mapPlanet);

  const angles: WesternAstrolabePoint[] = [
    chart.angles.ascendant,
    chart.angles.midheaven,
    chart.angles.descendant,
    chart.angles.imumCoeli,
  ].map(mapAngle);

  const houses: WesternAstrolabePoint[] = chart.houses.cusps.map((cusp) => ({
    name: `House ${cusp.house}`,
    label: HOUSE_NAME_MAP[cusp.house] ?? `第${cusp.house}宫`,
    longitude: cusp.longitude,
    sign: SIGN_LABELS[cusp.signName] ?? cusp.signName,
    degree: cusp.degree,
    minute: cusp.minute,
    house: cusp.house,
    formatted: formatPosition(cusp.signName, cusp.degree, cusp.minute),
  }));

  const aspects: WesternAstrolabeAspect[] = chart.aspects.all.map(mapAspect);

  const summary: WesternChartSummary = {
    elements: {
      火: chart.summary.elements.fire.map((item) => PLANET_LABELS[item] ?? item),
      土: chart.summary.elements.earth.map((item) => PLANET_LABELS[item] ?? item),
      风: chart.summary.elements.air.map((item) => PLANET_LABELS[item] ?? item),
      水: chart.summary.elements.water.map((item) => PLANET_LABELS[item] ?? item),
    },
    modalities: {
      开创: chart.summary.modalities.cardinal.map((item) => PLANET_LABELS[item] ?? item),
      固定: chart.summary.modalities.fixed.map((item) => PLANET_LABELS[item] ?? item),
      变动: chart.summary.modalities.mutable.map((item) => PLANET_LABELS[item] ?? item),
    },
    retrograde: chart.summary.retrograde.map((item) => PLANET_LABELS[item] ?? item),
    patterns: chart.summary.patterns,
  };

  return {
    birth: birthInfo,
    planets,
    angles,
    houses,
    aspects,
    summary,
    timestamp: Date.now(),
  };
}

// ============================================================================
// 行运分析内部函数
// ============================================================================

/**
 * 构建本命宫主星链条文本
 *
 * @param data 本命盘数据
 * @returns 宫主星链条描述文本
 */
function buildHouseRulerChainText(data: WesternAstrolabeData): string {
  const lines = data.houses
    .slice()
    .sort((first, second) => first.house - second.house)
    .map((house) => {
      const ruler = HOUSE_RULER_MAP[house.sign];
      if (!ruler) {
        return `第${house.house}宫${house.sign}宫头：宫主星未识别，只按宫头星座和宫内星体保守判断`;
      }

      const primary = data.planets.find((planet) => planet.name === ruler.primary);
      const modern = ruler.modern
        ? data.planets.find((planet) => planet.name === ruler.modern)
        : null;
      const primaryLabel = PLANET_LABELS[ruler.primary] ?? ruler.primary;
      const primaryText = primary
        ? `${primaryLabel}落本命第${primary.house}宫${primary.formatted}${primary.retrograde ? '逆行' : ''}`
        : `${primaryLabel}未写入落点`;
      const modernText =
        ruler.modern && modern
          ? `，现代辅看${PLANET_LABELS[ruler.modern] ?? ruler.modern}落本命第${modern.house}宫`
          : ruler.modern
            ? `，现代辅看${PLANET_LABELS[ruler.modern] ?? ruler.modern}但未写入落点`
            : '';

      return `第${house.house}宫${house.sign}宫头，${primaryText}${modernText}`;
    });

  return `本命宫主星链条：${lines.join('；')}；宫主星链条只用于定位议题落点，不能脱离本命星体、相位和行运触发单独下结论。`;
}

/**
 * 格式化行运相位为结构化对象
 */
function formatTransitObject(transit: Transit): WesternTransitAspect {
  return {
    transitingBody: transit.transitingBodyEnum ?? transit.transitingBody,
    transitingBodyLabel: PLANET_LABELS[transit.transitingBodyEnum] ??
      PLANET_LABELS[transit.transitingBody] ??
      transit.transitingBody,
    natalPoint: transit.natalPoint,
    natalPointLabel: NATAL_POINT_NAME_MAP[transit.natalPoint] ?? transit.natalPoint,
    aspectType: ASPECT_LABELS[transit.aspectType] ?? transit.aspectType,
    symbol: transit.symbol,
    deviation: Number(transit.deviation.toFixed(2)),
    strength: Math.round(transit.strength),
    phase: PHASE_LABELS[transit.phase] ?? transit.phase,
    isRetrograde: transit.isRetrograde,
  };
}

/**
 * 计算行运相位证据
 *
 * @param data 本命盘数据
 * @param target 目标日期
 * @param timezone 时区偏移
 * @returns 行运相位列表
 * @throws 当本命点不足或计算失败时抛出 Error
 */
function buildTransitAspects(
  data: WesternAstrolabeData,
  target: { year: number; month: number; day: number },
  timezone: number,
): WesternTransitAspect[] {
  const natalPoints = buildNatalPoints(data);
  if (natalPoints.length < 3) {
    throw new Error('本命点经度资料不足，无法计算行运相位');
  }

  const julianDate = time.toJulianDate({
    year: target.year,
    month: target.month,
    day: target.day,
    hour: 12,
    minute: 0,
    second: 0,
    timezone,
  });
  const result = calculateTransits(natalPoints, julianDate, {
    aspectTypes: [
      AspectType.Conjunction,
      AspectType.Sextile,
      AspectType.Square,
      AspectType.Trine,
      AspectType.Opposition,
    ],
    transitingBodies: TRANSITING_BODIES,
    minimumStrength: 35,
    includeOutOfSign: true,
  });

  return result.transits
    .sort(
      (first, second) => second.strength - first.strength || first.deviation - second.deviation,
    )
    .slice(0, 12)
    .map(formatTransitObject);
}

/**
 * 计算行运落宫证据
 *
 * @param data 本命盘数据
 * @param target 目标日期
 * @param timezone 时区偏移
 * @returns 行运落宫列表
 */
function buildTransitHouses(
  data: WesternAstrolabeData,
  target: { year: number; month: number; day: number },
  timezone: number,
): WesternTransitHouse[] {
  const cusps = getNatalHouseCusps(data);
  if (!cusps) {
    return [];
  }

  const coordinates = parseBirthCoordinates(data);

  const transitPlanets = calculatePlanets(
    {
      year: target.year,
      month: target.month,
      day: target.day,
      hour: 12,
      minute: 0,
      second: 0,
      timezone,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
    },
    {
      houseSystem: 'placidus',
      includeAsteroids: false,
      includeChiron: false,
      includeLilith: false,
      includeNodes: false,
      includeLots: false,
    },
  );

  return transitPlanets
    .filter((planet) => VALID_PLANET_NAMES.has(planet.name))
    .map((planet) => {
      const natalHouse = getNatalHouseByLongitude(planet.longitude, cusps);
      return {
        body: planet.name,
        bodyLabel: PLANET_LABELS[planet.name] ?? planet.name,
        position: formatPlanetPosition(planet),
        natalHouse,
        isRetrograde: planet.isRetrograde,
      };
    });
}

/**
 * 构建本命盘精简摘要
 *
 * @param data 本命盘数据
 * @returns 精简摘要（供 scope 输出嵌入）
 */
function buildNatalSummary(data: WesternAstrolabeData): WesternNatalSummary {
  const planetSummary: Record<string, string> = {};
  for (const planet of data.planets) {
    const retrogradeMark = planet.retrograde ? '℞ ' : '';
    planetSummary[planet.label] = `${retrogradeMark}${planet.sign}${planet.degree}°${String(planet.minute).padStart(2, '0')}′ 第${planet.house}宫`;
  }

  const angleSummary: Record<string, string> = {};
  for (const angle of data.angles) {
    angleSummary[angle.label] = `${angle.sign}${angle.degree}°${String(angle.minute).padStart(2, '0')}′`;
  }

  return {
    dateTime: data.birth.dateTime,
    location: data.birth.location,
    planets: planetSummary,
    angles: angleSummary,
    chartSummary: data.summary,
  };
}

// ============================================================================
// 核心导出：运限分析（行运 / 日返 / 次限）
// ============================================================================

/**
 * 生成西方占星运限分析
 *
 * 根据 scopeType 分发到对应的计算逻辑：
 * - transit: 行运分析（celestine calculateTransits）
 * - solar_return: 日返盘（暂未实现，返回提示信息）
 * - secondary_progression: 次限推进（celestine calculateProgression）
 *
 * @param options 运限分析输入（含完整出生参数 + 目标日期 + scopeType）
 * @returns 运限分析数据，含本命盘精简摘要
 */
export function generateWesternScope(options: WesternScopeOptions): WesternScopeData {
  const scopeType = options.scopeType ?? 'transit';
  if (scopeType === 'solar_return') {
    return buildSolarReturnScope(options);
  }
  if (scopeType === 'secondary_progression') {
    return buildSecondaryProgressionScope(options);
  }

  // === transit 行运分析（原有逻辑） ===
  const natalData = generateWesternAstrolabe(options as WesternAstrolabeOptions);

  validateSolarDate(options.targetYear, options.targetMonth, options.targetDay);
  const targetHour = options.targetHour ?? 12;
  const targetMinute = options.targetMinute ?? 0;
  validateTimePart(targetHour, targetMinute);

  const targetDate = `${options.targetYear}-${String(options.targetMonth).padStart(2, '0')}-${String(options.targetDay).padStart(2, '0')}`;
  const anchorDateTime = `${targetDate} ${String(targetHour).padStart(2, '0')}:${String(targetMinute).padStart(2, '0')}`;

  const timezone = options.timezone ?? 8;
  const target = {
    year: options.targetYear,
    month: options.targetMonth,
    day: options.targetDay,
  };

  const houseRulerChain = buildHouseRulerChainText(natalData);

  let transitAspects: WesternTransitAspect[] = [];
  try {
    transitAspects = buildTransitAspects(natalData, target, timezone);
  } catch {
    transitAspects = [];
  }

  let transitHouses: WesternTransitHouse[] = [];
  try {
    transitHouses = buildTransitHouses(natalData, target, timezone);
  } catch {
    transitHouses = [];
  }

  const natalSummary = buildNatalSummary(natalData);

  return {
    natalSummary,
    scopeType,
    targetDate,
    anchorDateTime,
    houseRulerChain,
    transitAspects,
    transitHouses,
    limitationNotice: TECH_LIMIT_NOTICE,
  };
}

// ============================================================================
// 运限类型辅助函数
// ============================================================================

/**
 * 日返盘（Solar Return）占位函数
 *
 * celestine 库暂不提供日返盘计算 API，返回明确提示信息。
 * 同时提供本命盘精简摘要供 AI 参考。
 *
 * @param options 运限分析输入
 * @returns 含提示信息的运限分析数据
 */
function buildSolarReturnScope(options: WesternScopeOptions): WesternScopeData {
  const natalData = generateWesternAstrolabe(options as WesternAstrolabeOptions);
  const targetDate = `${options.targetYear}-${String(options.targetMonth).padStart(2, '0')}-${String(options.targetDay).padStart(2, '0')}`;
  const anchorDateTime = `${targetDate} ${String(options.targetHour ?? 12).padStart(2, '0')}:${String(options.targetMinute ?? 0).padStart(2, '0')}`;
  const houseRulerChain = buildHouseRulerChainText(natalData);
  const natalSummary = buildNatalSummary(natalData);

  return {
    natalSummary,
    scopeType: 'solar_return',
    targetDate,
    anchorDateTime,
    houseRulerChain,
    transitAspects: [],
    transitHouses: [],
    limitationNotice: SOLAR_RETURN_NOTICE,
  };
}

/**
 * 次限推进（Secondary Progression）分析
 *
 * 调用 celestine calculateProgression() 获取次限推进数据，
 * 映射为 WesternScopeData 格式。
 *
 * @param options 运限分析输入
 * @returns 次限推进分析数据
 */
function buildSecondaryProgressionScope(options: WesternScopeOptions): WesternScopeData {
  const natalData = generateWesternAstrolabe(options as WesternAstrolabeOptions);

  validateSolarDate(options.targetYear, options.targetMonth, options.targetDay);
  const targetHour = options.targetHour ?? 12;
  const targetMinute = options.targetMinute ?? 0;
  validateTimePart(targetHour, targetMinute);

  const targetDate = `${options.targetYear}-${String(options.targetMonth).padStart(2, '0')}-${String(options.targetDay).padStart(2, '0')}`;
  const anchorDateTime = `${targetDate} ${String(targetHour).padStart(2, '0')}:${String(targetMinute).padStart(2, '0')}`;

  const houseRulerChain = buildHouseRulerChainText(natalData);
  const natalSummary = buildNatalSummary(natalData);

  const birth: ProgressionBirthData = {
    year: options.year,
    month: options.month,
    day: options.day,
    hour: options.hour,
    minute: options.minute,
    second: 0,
    timezone: options.timezone ?? 8,
    latitude: options.latitude,
    longitude: options.longitude,
  };

  const target = {
    year: options.targetYear,
    month: options.targetMonth,
    day: options.targetDay,
    hour: targetHour,
    minute: targetMinute,
  };

  let progressedChart: ProgressedChart | null = null;
  try {
    progressedChart = calculateProgression(birth, target, {
      type: 'secondary',
      includeNatalAspects: true,
      includeProgressedAspects: false,
    });
  } catch {
    return {
      natalSummary,
      scopeType: 'secondary_progression',
      targetDate,
      anchorDateTime,
      houseRulerChain,
      transitAspects: [],
      transitHouses: [],
      limitationNotice: '次限推进计算失败：celestine calculateProgression 调用出错。',
    };
  }

  const cusps = getNatalHouseCusps(natalData);

  const transitAspects: WesternTransitAspect[] = progressedChart.aspectsToNatal
    .sort((first, second) => second.strength - first.strength || first.deviation - second.deviation)
    .slice(0, 12)
    .map(mapProgressedAspect);

  const transitHouses: WesternTransitHouse[] = cusps
    ? progressedChart.planets
        .filter((planet) => VALID_PLANET_NAMES.has(planet.name))
        .map((planet) => ({
          body: planet.name,
          bodyLabel: PLANET_LABELS[planet.name] ?? planet.name,
          position: `${SIGN_LABELS[planet.signName] ?? planet.signName}${planet.degree}°${String(planet.minute).padStart(2, '0')}′`,
          natalHouse: getNatalHouseByLongitude(planet.longitude, cusps),
          isRetrograde: planet.isRetrograde,
        }))
    : [];

  return {
    natalSummary,
    scopeType: 'secondary_progression',
    targetDate,
    anchorDateTime,
    houseRulerChain,
    transitAspects,
    transitHouses,
    limitationNotice: TECH_LIMIT_NOTICE,
  };
}

/**
 * 将 celestine ProgressedAspect 映射为 WesternTransitAspect
 *
 * @param aspect 次限推进相位
 * @returns 行运相位格式
 */
function mapProgressedAspect(aspect: ProgressedAspect): WesternTransitAspect {
  const bodyEnum = aspect.progressedBodyEnum ?? '';
  return {
    transitingBody: bodyEnum || aspect.progressedBody,
    transitingBodyLabel: PLANET_LABELS[bodyEnum] ?? PLANET_LABELS[aspect.progressedBody] ?? aspect.progressedBody,
    natalPoint: aspect.natalBody,
    natalPointLabel: NATAL_POINT_NAME_MAP[aspect.natalBody] ?? aspect.natalBody,
    aspectType: ASPECT_LABELS[aspect.aspectType] ?? aspect.aspectType,
    symbol: aspect.symbol,
    deviation: Number(aspect.deviation.toFixed(2)),
    strength: Math.round(aspect.strength),
    phase: PHASE_LABELS[aspect.phase] ?? aspect.phase,
    isRetrograde: aspect.isRetrograde,
  };
}
