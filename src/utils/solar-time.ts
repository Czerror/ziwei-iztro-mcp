/**
 * 真太阳时计算工具
 * 基于 Jean Meeus 天文算法实现儒略日计算、均时差计算及真太阳时转换
 * 用于将北京时间根据观测地经度修正为地方真太阳时
 */

/** 北京时间基准经度（东经120°） */
const BEIJING_REFERENCE_LONGITUDE = 120;

/** 儒略日计算常量：J2000.0 纪元对应的儒略日 */
const J2000 = 2451545.0;

/** 儒略世纪年数 */
const JULIAN_CENTURY_YEARS = 36525.0;

/** 弧度转角度的乘数 */
const RAD_TO_DEG = 180 / Math.PI;

/** 均时差弧度转分钟乘数 */
const EQUATION_RAD_TO_MINUTES = 4 * RAD_TO_DEG;

/**
 * 时辰到时间区间的映射（24小时制）
 * key: 时辰名称（不含"时"字）
 * value: [起始小时, 结束小时]，区间左闭右开
 */
export const SHICHEN_MAP: Record<string, [number, number]> = {
  '子': [23, 1],   // 子时 23:00-01:00
  '丑': [1, 3],    // 丑时 01:00-03:00
  '寅': [3, 5],    // 寅时 03:00-05:00
  '卯': [5, 7],    // 卯时 05:00-07:00
  '辰': [7, 9],    // 辰时 07:00-09:00
  '巳': [9, 11],   // 巳时 09:00-11:00
  '午': [11, 13],  // 午时 11:00-13:00
  '未': [13, 15],  // 未时 13:00-15:00
  '申': [15, 17],  // 申时 15:00-17:00
  '酉': [17, 19],  // 酉时 17:00-19:00
  '戌': [19, 21],  // 戌时 19:00-21:00
  '亥': [21, 23],  // 亥时 21:00-23:00
};

/**
 * 时辰名称列表（含"时"后缀），用于匹配输入
 */
export const SHICHEN_NAMES: string[] = Object.keys(SHICHEN_MAP).map((name) => `${name}时`);

/**
 * 解析时间输入的结果
 */
export interface ParsedTimeResult {
  /** 解析后的小时（24小时制） */
  hour: number;
  /** 解析后的分钟 */
  minute: number;
  /** 是否应跳过真太阳时修正（时辰输入时为 true） */
  skipSolarTime: boolean;
}

/**
 * 解析用户输入的时间字符串，支持三种格式：
 * 1. 具体时间："14:30"、"14"
 * 2. 时间范围："13-15"、"13-15点"、"13～15" → 取中间值
 * 3. 时辰："丑时"、"午时" → 取中间值，且标记跳过真太阳时修正
 *
 * @param input - 用户输入的时间字符串
 * @returns 解析后的时间结果
 * @throws {Error} 当输入格式无法识别时抛出
 */
export function parseTimeInput(input: string): ParsedTimeResult {
  const trimmed = input.trim();

  // 1. 匹配时辰（如"丑时"、"午时"）
  for (const [name, [start, end]] of Object.entries(SHICHEN_MAP)) {
    const pattern = new RegExp(`^${name}时$`);
    if (pattern.test(trimmed)) {
      // 子时特殊处理：23-1，中间值取0点（即24:00 → 00:00）
      let middleHour: number;
      if (name === '子') {
        middleHour = 0; // 子时 23:00-01:00，取 00:00
      } else {
        middleHour = Math.floor((start + end) / 2);
      }
      return { hour: middleHour, minute: 0, skipSolarTime: true };
    }
  }

  // 2. 匹配时间范围（如"13-15"、"13-15点"、"13～15点"）
  const rangeMatch = trimmed.match(/^(\d{1,2})\s*[-～~]\s*(\d{1,2})点?$/);
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1], 10);
    const end = parseInt(rangeMatch[2], 10);
    if (start >= 0 && start <= 23 && end >= 0 && end <= 23 && start < end) {
      const middleHour = Math.floor((start + end) / 2);
      return { hour: middleHour, minute: 0, skipSolarTime: false };
    }
  }

  // 3. 匹配具体时间（如"14:30"、"14"）
  const timeMatch = trimmed.match(/^(\d{1,2})(?::(\d{2}))?$/);
  if (timeMatch) {
    const hour = parseInt(timeMatch[1], 10);
    const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return { hour, minute, skipSolarTime: false };
    }
  }

  throw new Error(
    `无法解析时间输入: "${input}"。支持的格式：具体时间(14:30)、时间范围(13-15)、时辰(丑时)`
  );
}

/**
 * 计算儒略日（Julian Day）
 * 将公历日期转换为儒略日数，用于天文学计算。
 * 算法基于公历转儒略日的标准公式。
 *
 * @param date 公历日期对象
 * @returns 儒略日数值
 */
export function calculateJulianDay(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();

  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;

  const jdn =
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045;
  const jd = jdn + (hour - 12) / 24 + minute / 1440 + second / 86400;

  return jd;
}

/**
 * 计算均时差（Equation of Time）
 * 基于 Jean Meeus 算法，计算平太阳时与真太阳时之间的差值。
 * 涉及太阳几何平黄经、地球轨道离心率、平黄道倾角等天文参数。
 * 算法保留完整的天文学计算逻辑，不做简化。
 *
 * @param julianDay 儒略日数值
 * @returns 均时差，单位为分钟（正值表示真太阳时超前平太阳时）
 */
export function calculateEquationOfTime(julianDay: number): number {
  // 儒略世纪数（自 J2000.0 起算）
  const T = (julianDay - J2000) / JULIAN_CENTURY_YEARS;

  // 平黄道倾角（弧度）
  const epsilon =
    (84381.406 +
      T *
        (-46.836769 +
          T *
            (-0.0001831 +
              T * (0.0020034 + T * (-0.000000576 - T * 0.0000000434))))) *
    (Math.PI / (180 * 3600));

  // 几何平黄经（度），规范化为 0-360 度
  let L0 =
    280.4664567 +
    T *
      (36000.76982779 +
        T *
          (0.0003032028 +
            T * (1 / 49931 - T * (T / 15300000 + T / 2000000))));
  L0 = ((L0 % 360) + 360) % 360;
  const L0Rad = (L0 * Math.PI) / 180;

  // 地球轨道离心率
  const e =
    0.0167086342 +
    T *
      (-0.004203654 +
        T *
          (-0.0000126734 +
            T * (0.000001444 + T * (-0.000000002 + T * 0.000000003))));

  // 平近点角（度），规范化为 0-360 度
  let M =
    (1287104.79305 +
      T * (129596581.0481 + T * (-0.5532 + T * (0.000136 - T * 0.00001149)))) /
    3600;
  M = ((M % 360) + 360) % 360;
  const MRad = (M * Math.PI) / 180;

  // y = tan²(ε/2)
  const y = Math.tan(epsilon / 2) ** 2;

  // 时间差方程（弧度）
  const ERad =
    -y * Math.sin(2 * L0Rad) +
    2 * e * Math.sin(MRad) -
    4 * e * y * Math.sin(MRad) * Math.cos(2 * L0Rad) +
    0.5 * y * y * Math.sin(4 * L0Rad) +
    1.25 * e * e * Math.sin(2 * MRad);

  // 转换为分钟
  const EMinutes = EQUATION_RAD_TO_MINUTES * ERad;

  return EMinutes;
}

/**
 * 将给定日期时间转换为真太阳时（返回 Date 对象版本）
 *
 * @param date - JavaScript Date 对象，表示北京时间
 * @param longitude - 观测地点的经度（东经为正）
 * @param _latitude - 观测地点的纬度（保留参数，当前未使用）
 * @param useSolarTime - 是否启用真太阳时修正，默认 false 不修正
 * @returns 真太阳时对应的 Date 对象；如果 useSolarTime 为 false，则返回原始 date 的副本
 */
export function convertToSolarTime(
  date: Date,
  longitude: number,
  _latitude?: number,
  useSolarTime: boolean = false,
): Date {
  // 如果不启用真太阳时修正，直接返回原始时间的副本
  if (!useSolarTime) {
    return new Date(date.getTime());
  }

  const julianDay = calculateJulianDay(date);
  const equationOfTime = calculateEquationOfTime(julianDay);

  // 计算地方平太阳时：北京时间按经度差修正（每度4分钟）
  const localMeanTime =
    date.getTime() +
    (longitude - BEIJING_REFERENCE_LONGITUDE) * 4 * 60 * 1000;

  // 计算真太阳时：平太阳时 + 均时差
  const apparentSolarTime = new Date(
    localMeanTime + equationOfTime * 60 * 1000,
  );

  return apparentSolarTime;
}
