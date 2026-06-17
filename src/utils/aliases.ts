/** 参数名别名映射：将 AI 常见的别名统一映射到标准参数名 */
export const PARAM_NAME_ALIASES: Record<string, string> = {
  birthTime: 'date',
  birthday: 'date',
  birthDate: 'date',
  birth: 'date',
  sex: 'gender',
  calendarType: 'dateType',
  calendar: 'dateType',
  shichen: 'timeIndex',
  earthlyBranch: 'timeIndex',
};

/**
 * 应用参数名别名：浅层 key 映射，不递归
 * 标准参数名优先，别名不覆盖已存在的标准参数名
 *
 * @param input 原始输入对象
 * @returns 别名映射后的新对象
 */
export function applyParamAliases(input: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    const canonicalKey = PARAM_NAME_ALIASES[key] || key;
    if (!(canonicalKey in result) || !(key in PARAM_NAME_ALIASES)) {
      result[canonicalKey] = value;
    }
  }
  return result;
}

/** 性别枚举别名映射 */
export const GENDER_ALIASES: Record<string, 'male' | 'female'> = {
  '男': 'male', '女': 'female',
  'Male': 'male', 'Female': 'female',
  'MALE': 'male', 'FEMALE': 'female',
};

/** 日期类型枚举别名映射 */
export const DATE_TYPE_ALIASES: Record<string, 'solar' | 'lunar'> = {
  '公历': 'solar', '阳历': 'solar', 'gregorian': 'solar',
  '农历': 'lunar', '阴历': 'lunar', 'chinese': 'lunar',
};

/** 星盘类型枚举别名映射 */
export const ASTRO_TYPE_ALIASES: Record<string, 'heaven' | 'earth' | 'human'> = {
  '天盘': 'heaven', '地盘': 'earth', '人盘': 'human',
};

/** 合盘类型枚举别名映射 */
export const SYNASTRY_TYPE_ALIASES: Record<string, string> = {
  '感情': 'romance', '婚姻': 'romance', '恋爱': 'romance',
  '事业': 'career', '合作': 'career',
  '亲子': 'parenting', '子女': 'parenting',
};

/** 格局分类枚举别名映射 */
export const PATTERN_CATEGORY_ALIASES: Record<string, string> = {
  '上格': 'superior', '中格': 'middle', '恶格': 'caution',
  '基础格': 'basic', '助力格': 'support',
};

/**
 * 通用枚举映射函数：在 input 上原地将别名字符串替换为标准枚举值
 *
 * @param input 输入对象
 * @param field 要检查的字段名
 * @param aliasMap 别名→标准值的映射表
 */
export function applyEnumAliases<T extends Record<string, unknown>>(
  input: T,
  field: keyof T,
  aliasMap: Record<string, unknown>,
): void {
  const value = input[field];
  if (typeof value === 'string' && value in aliasMap) {
    (input as Record<string, unknown>)[field as string] = aliasMap[value];
  }
}
