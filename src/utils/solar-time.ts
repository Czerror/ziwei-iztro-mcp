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
 * 将北京时间转换为真太阳时
 * 首先根据观测地经度将北京时间修正为地方平太阳时，
 * 再叠加均时差得到真太阳时。
 *
 * @param beijingTime 北京时间，格式为 YYYY-MM-DD HH:mm:ss
 * @param longitude 观测地经度（东经为正，西经为负）
 * @param _latitude 观测地纬度（北纬为正，南纬为负，当前算法保留参数但未使用）
 * @returns 真太阳时字符串，格式为 YYYY-MM-DD HH:mm:ss
 * @throws {Error} 当时间格式无效时抛出
 */
export function convertToApparentSolarTime(
  beijingTime: string,
  longitude: number,
  _latitude?: number,
): string {
  const date = new Date(beijingTime);
  if (isNaN(date.getTime())) {
    throw new Error('无效的时间格式，期望格式：YYYY-MM-DD HH:mm:ss');
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

  const year = apparentSolarTime.getFullYear();
  const month = String(apparentSolarTime.getMonth() + 1).padStart(2, '0');
  const day = String(apparentSolarTime.getDate()).padStart(2, '0');
  const hours = String(apparentSolarTime.getHours()).padStart(2, '0');
  const minutes = String(apparentSolarTime.getMinutes()).padStart(2, '0');
  const seconds = String(apparentSolarTime.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
