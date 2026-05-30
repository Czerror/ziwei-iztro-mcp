# ziwei-mcp

紫微斗数星盘的 MCP（Model Context Protocol）服务器，提供星盘创建、宫位查询、星耀分析、运限推算等功能。

## 概述

ziwei-mcp 将 [iztro](https://github.com/archenemy/iztro) 紫微斗数库封装为 MCP 协议兼容的服务，可通过 Claude Desktop、Cursor、以及其他支持 MCP 的客户端直接调用星盘分析功能。

- **星盘创建**：支持公历/农历日期，返回完整十二宫数据
- **宫位分析**：查询任意宫位的星耀分布、四化、飞化关系
- **运限推算**：获取大限、小限、流年、流月、流日、流时数据
- **快捷查询**：生肖、星座、命宫主星等独立查询（无需创建完整星盘）
- **全局配置**：支持四化规则、亮度、安星算法等参数配置
- **常量资源**：通过 Resource 暴露星耀目录、宫位对照表、天干地支等参考数据

## 安装

### 从 npm 安装（推荐）

```bash
npm install -g ziwei-mcp
```

### 从源码安装

```bash
git clone https://github.com/Czerror/ziwei-iztro-mcp.git
cd ziwei-iztro-mcp
npm install
npm run build
npm link
```

全局安装后，可通过 `ziwei-mcp` 命令直接启动。

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

## 配置

### Claude Desktop

在 Claude Desktop 的配置文件中添加：

- **macOS / Linux**: `~/.config/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "ziwei-mcp": {
      "command": "ziwei-mcp",
      "args": [],
      "env": {}
    }
  }
}
```


### Cursor

在 Cursor 的设置中添加 MCP 服务器，使用上述相同的配置。

### 通用 MCP 客户端

任何支持 `stdio` 传输的 MCP 客户端均可通过以下方式启动：

```bash
ziwei-mcp
```

## 可用 Tools

共 11 个 Tool：

| Tool 名称 | 描述 | 核心参数 |
| --- | --- | --- |
| `get_astrolabe` | 根据出生日期和时间创建星盘。可选提供 `longitude`/`latitude`，自动用Meeus算法校正真太阳时。AI可自行根据城市名推断经纬度 | `dateType`, `date`, `timeIndex`, `gender`, `longitude?`, `latitude?` |
| `get_horoscope` | 通过 reconstructionKey 重建星盘并获取运限（大限、小限、流年、流月、流日、流时） | `reconstructionKey`, `targetDate`, `timeIndex` |
| `get_palace_info` | 通过 reconstructionKey 获取宫位详情（星耀、四化、天干地支等） | `reconstructionKey`, `palace` |
| `get_star_info` | 通过 reconstructionKey 获取星耀详情（亮度、四化、所在宫位、三方四正） | `reconstructionKey`, `starName` |
| `get_surrounded_palaces` | 通过 reconstructionKey 获取三方四正宫位数据 | `reconstructionKey`, `palace` |
| `analyze_palace` | 通过 reconstructionKey 进行综合宫位分析 | `reconstructionKey`, `palace`, `hasStars`, `hasMutagen`, `fliesTo` 等 |
| `get_zodiac` | 根据公历日期获取对应的十二生肖（独立查询，无需星盘） | `date`, `language` |
| `get_sign` | 根据日期获取西方星座/黄道十二宫（支持公历/农历，无需星盘） | `dateType`, `date`, `isLeapMonth`, `language` |
| `get_soul_major_stars` | 获取命宫主星的简化查询（无需创建完整星盘，空宫自动借对宫） | `dateType`, `date`, `timeIndex` |
| `configure` | 配置服务器全局参数：四化规则、星耀亮度、分界点、安星算法 | `yearDivide`, `horoscopeDivide`, `algorithm`, `mutagens` 等 |
| `convert_solar_time` | 将北京时间根据经纬度转换为真太阳时（Jean Meeus天文算法） | `beijingTime`, `longitude`, `latitude` |

### `get_astrolabe` 参数详解

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `dateType` | `"solar" \| "lunar"` | ✓ | 日期类型：公历或农历 |
| `date` | `string` | ✓ | 日期字符串，格式 `YYYY-M-D`，如 `"2000-1-15"` |
| `timeIndex` | `number` | ✓ | 时辰索引，范围 0-12（0=早子时, 1=丑时, ..., 12=晚子时） |
| `gender` | `string` | ✓ | 性别，如 `"male"` 或 `"female"` |
| `isLeapMonth` | `boolean` | | 是否为闰月（仅农历），默认 `false` |
| `fixLeap` | `boolean` | | 是否修正闰月，默认 `true` |
| `longitude` | `number` | | 出生地经度（东经为正）。AI可自行根据城市名推断经纬度，如北京≈116.4、上海≈121.5 |
| `latitude` | `number` | | 出生地纬度（北纬为正），可选 |
| `language` | `string` | | 输出语言：`"zh-CN"`、`"zh-TW"`、`"en-US"`、`"ja-JP"`、`"ko-KR"`、`"vi-VN"`，默认 `"zh-CN"` |
| `astroType` | `string` | | 星盘类型：`"heaven"`（天盘）、`"earth"`（地盘）、`"human"`（人盘），默认 `"heaven"` |
| `config` | `object` | | 本次查询的独立配置覆盖 |

> **真太阳时校正**：当提供 `longitude` 时，服务器会自动使用 Jean Meeus 天文算法将北京时间转换为出生地真太阳时，并据此调整时辰索引。响应中会包含 `solarTimeCorrection` 字段显示校正详情。AI 可凭借自身知识直接提供经纬度（如"北京"≈116.4, "上海"≈121.5），无需调用外部 API。

### `convert_solar_time` 参数详解

参数 | 类型 | 必填 | 说明 |
--- | --- | --- | --- |
| `beijingTime` | `string` | ✓ | 北京时间，格式 `YYYY-MM-DD HH:mm:ss` |
| `longitude` | `number` | ✓ | 经度（东经为正，-180~180） |
| `latitude` | `number` | | 纬度（北纬为正，-90~90），可选 |

> 推荐直接使用 `get_astrolabe` 的 `longitude` 参数让服务器自动完成转换，无需单独调用此 Tool。

### `analyze_palace` 参数详解

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `astrolabeData` | `object` | ✓ | 由 `get_astrolabe` 返回的完整星盘数据 |
| `palace` | `string \| number` | ✓ | 宫位名称（如 `"命宫"`）或索引（0-11） |
| `hasStars` | `string[]` | | 检查宫位是否包含所有指定星耀（AND 逻辑） |
| `hasOneOfStars` | `string[]` | | 检查宫位是否包含任一指定星耀（OR 逻辑） |
| `notHaveStars` | `string[]` | | 检查宫位是否不包含这些星耀 |
| `hasMutagen` | `string` | | 检查宫位是否有特定四化（如 `"禄"`） |
| `isEmpty` | `object` | | 空宫判断，可指定 `excludeStars` 排除星耀列表 |
| `fliesTo` | `object` | | 检查本宫是否有星耀四化飞到目标宫位 |
| `selfMutaged` | `string \| string[]` | | 检查宫位是否有自化 |
| `getMutagedPlaces` | `boolean` | | 获取所有被本宫四化飞入的宫位列表 |

### `configure` 参数详解

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `yearDivide` | `"normal" \| "exact"` | 年分割点：正月初一 or 立春 |
| `horoscopeDivide` | `"normal" \| "exact"` | 运限分割点：初一 or 节气 |
| `ageDivide` | `"normal" \| "birthday"` | 小限分割点：自然年 or 生日 |
| `dayDivide` | `"current" \| "forward"` | 晚子时处理：算当日 or 算次日 |
| `algorithm` | `"default" \| "zhongzhou"` | 安星算法：通用版本 or 中州派版本 |
| `mutagens` | `object` | 自定义四化规则 |
| `brightness` | `object` | 自定义星耀亮度 |
| `reset` | `boolean` | 重置为默认配置 |

## 可用 Resources

共 7 个 Resource：

| Resource 名称 | URI | 说明 |
| --- | --- | --- |
| `stars-catalog` | `iztro://constants/stars` | 所有星耀目录：14 主星 + 14 辅星 + 41 杂耀 + 12 长生神 |
| `palace-names` | `iztro://constants/palace-names` | 十二宫加身宫的名称、索引和描述 |
| `heavenly-stems` | `iztro://constants/heavenly-stems` | 十天干列表（甲、乙、丙、丁、戊、己、庚、辛、壬、癸） |
| `earthly-branches` | `iztro://constants/earthly-branches` | 十二地支列表（子、丑、寅、卯、辰、巳、午、未、申、酉、戌、亥） |
| `time-periods` | `iztro://constants/time-periods` | 时辰索引与时间段对照表（0=早子时 ～ 12=晚子时） |
| `languages` | `iztro://constants/languages` | iztro 支持的多语言列表 |
| `config-reference` | `iztro://constants/config-reference` | 全局配置参数参考（所有可选值及说明） |

## 使用示例

以下示例展示在 MCP 客户端中调用 `get_astrolabe` 的完整流程。

### 请求（含真太阳时校正）

```json
{
  "method": "tools/call",
  "params": {
    "name": "get_astrolabe",
    "arguments": {
      "dateType": "solar",
      "date": "2000-1-15",
      "timeIndex": 5,
      "gender": "male",
      "longitude": 116.4,
      "latitude": 39.9,
      "language": "zh-CN",
      "astroType": "heaven"
    }
  }
}
```

> `longitude`/`latitude` 为可选参数。AI 可自行根据用户提供的城市名推断经纬度（如北京≈116.4, 上海≈121.5），无需调用外部 API。

### 响应（含真太阳时校正信息）

```json
{
  "solarDate": "2000年1月15日",
  "lunarDate": "1999年12月9日",
  "chineseDate": "己卯年 腊月 初九日",
  "time": "卯时",
  "timeRange": "05:00~07:00",
  "sign": "摩羯座",
  "zodiac": "兔",
  "earthlyBranchOfSoulPalace": "寅",
  "earthlyBranchOfBodyPalace": "寅",
  "soul": "寅",
  "solarTimeCorrection": {
    "beijingTime": "2000-01-15 09:30:00",
    "apparentSolarTime": "2000-01-15 09:16:23",
    "longitude": 116.4,
    "originalTimeIndex": 5,
    "adjustedTimeIndex": 5
  },
  "body": "寅",
  "fiveElementsClass": "水二局",
  "copyright": "iztro 开源项目 (MIT License)",
  "palaces": [
    {
      "index": 0,
      "name": "命宫",
      "isBodyPalace": true,
      "isOriginalPalace": true,
      "heavenlyStem": "丙",
      "earthlyBranch": "寅",
      "majorStars": [
        { "name": "天同", "type": "major", "scope": "origin", "brightness": "平" },
        { "name": "天梁", "type": "major", "scope": "origin", "brightness": "庙" }
      ],
      "minorStars": [
        { "name": "陀罗", "type": "minor", "scope": "origin" }
      ],
      "adjectiveStars": [],
      "changsheng12": "帝旺",
      "boshi12": "力士",
      "jiangqian12": "指背",
      "suiqian12": "病符",
      "decadal": {
        "range": [5, 14],
        "heavenlyStem": "丙",
        "earthlyBranch": "寅"
      },
      "ages": [5]
    }
  ]
}
```

> **注意**：以上响应为简化示例，实际响应包含完整的十二宫数据。

### 后续查询示例

获取 `get_astrolabe` 返回的 `reconstructionKey` 后，将其传递给其他 Tool 即可重建星盘：

```json
// 查询命宫详情
{
  "method": "tools/call",
  "params": {
    "name": "get_palace_info",
    "arguments": {
      "reconstructionKey": { "dateType": "solar", "date": "2000-1-15", "timeIndex": 5, "gender": "male", "isLeapMonth": false },
      "palace": "命宫"
    }
  }
}

// 查询三方四正
{
  "method": "tools/call",
  "params": {
    "name": "get_surrounded_palaces",
    "arguments": {
      "reconstructionKey": { "dateType": "solar", "date": "2000-1-15", "timeIndex": 5, "gender": "male", "isLeapMonth": false },
      "palace": "命宫"
    }
  }
}
```

> `reconstructionKey` 仅含 5 个字段（dateType/date/timeIndex/gender/isLeapMonth），从 `get_astrolabe` 响应中直接复制即可，无需传递庞大的完整星盘数据。

## 技术栈

- [TypeScript](https://www.typescriptlang.org/) ^5.2.0 — 类型安全
- [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk) ^1.0.0 — MCP 协议实现
- [Zod](https://zod.dev/) ^4.0.0 — 运行时参数校验
- [iztro](https://www.npmjs.com/package/iztro) — 紫微斗数核心计算库

## 许可证

[MIT](LICENSE)

---

© 2025 iztro Contributors
