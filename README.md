# ziwei-mcp

基于 MCP（Model Context Protocol）协议的紫微斗数星盘服务器，将 [iztro](https://github.com/archenemy/iztro) 紫微斗数核心计算库封装为可供 AI 客户端直接调用的标准服务。支持 Claude Desktop、Cursor 及任何兼容 MCP 的客户端。

---

## 功能特性

- **星盘创建**：支持公历/农历日期，自动校正真太阳时（Jean Meeus 天文算法），返回完整十二宫数据
- **运限推算**：大限、小限、流年、流月、流日、流时——六层运限完整覆盖
- **宫位分析**：查询任意宫位的星耀分布、四化、飞化、自化及空宫判断
- **三方四正**：获取本宫 + 对宫 + 财帛位 + 官禄位的完整宫位数据
- **星耀查询**：查询任意星耀的亮度、四化、所在宫位及三方四正关系
- **格局检测**：自动识别 41 种紫微斗数格局（上格 8 种、中格 9 种、助力格 6 种、恶格 8 种、基础格 10 种）
- **合盘分析**：夫妻宫互映检测、命格兼容性评分（1-5★）、太阳太阴状态分析
- **快捷查询**：生肖、星座、命宫主星等独立查询，无需创建完整星盘
- **全局配置**：四化规则、星耀亮度、年/运限分界点、安星算法等参数可定制
- **知识资源**：通过 MCP Resource 暴露星耀目录、宫位对照表、天干地支、合盘知识库（倪海夏体系）等
- **轻量重建**：`reconstructionKey` 机制——下游工具仅需 5 个字段即可重建星盘，无需传递庞大数据

---

## 前置要求

| 环境 | 最低版本 |
|------|---------|
| Node.js | >= 18.0.0 |
| npm | >= 9.0.0 |

---

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

---

## MCP 配置

### Claude Desktop

在 Claude Desktop 配置文件中添加：

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

在 Cursor 的 MCP 设置中使用与 Claude Desktop 相同的配置。

### 通用 MCP 客户端

任何支持 `stdio` 传输的 MCP 客户端均可通过以下命令启动：

```bash
ziwei-mcp
```

---

## 可用工具

共 **14 个** MCP Tool：

### 星盘与运限

| 工具 | 描述 | 核心参数 |
|------|------|---------|
| [`get_astrolabe`](#get_astrolabe) | 创建紫微斗数星盘，支持公历/农历，自动校正真太阳时 | `dateType`, `date`, `timeIndex`, `gender` |
| [`get_horoscope`](#get_horoscope) | 获取指定日期的六层运限数据 | `reconstructionKey`, `targetDate?`, `timeIndex?` |

### 宫位分析

| 工具 | 描述 | 核心参数 |
|------|------|---------|
| [`get_palace_info`](#get_palace_info) | 获取宫位详情（主星、辅星、杂耀、四化、天干地支等） | `reconstructionKey`, `palace` |
| [`get_surrounded_palaces`](#get_surrounded_palaces) | 获取三方四正宫位数据（本宫 + 对宫 + 财帛 + 官禄） | `reconstructionKey`, `palace` |
| [`analyze_palace`](#analyze_palace) | 综合宫位分析（星耀存在性、四化、空宫、飞化、自化） | `reconstructionKey`, `palace`, 可选多项检查条件 |

### 星耀与格局

| 工具 | 描述 | 核心参数 |
|------|------|---------|
| [`get_star_info`](#get_star_info) | 查询星耀详细信息（亮度、四化、所在宫位、三方四正） | `reconstructionKey`, `starName` |
| [`get_patterns`](#get_patterns) | 检测 41 种紫微斗数格局 | `reconstructionKey`, `category?` |

### 合盘分析

| 工具 | 描述 | 核心参数 |
|------|------|---------|
| [`get_synastry`](#get_synastry) | 合盘综合分析（夫妻宫互映、兼容性评分、太阳太阴状态） | `reconstructionKeyA`, `reconstructionKeyB` |
| [`get_heming_star`](#get_heming_star) | 查询十四主星在夫妻宫的完整断语（倪海夏体系） | `starName` |

### 快捷查询

| 工具 | 描述 | 核心参数 |
|------|------|---------|
| [`get_zodiac`](#get_zodiac) | 根据公历日期获取生肖 | `date`, `language?` |
| [`get_sign`](#get_sign) | 根据日期获取西方星座（支持公历/农历） | `dateType`, `date` |
| [`get_soul_major_stars`](#get_soul_major_stars) | 获取命宫主星（简化查询，空宫自动借对宫） | `dateType`, `date`, `timeIndex` |

### 系统工具

| 工具 | 描述 | 核心参数 |
|------|------|---------|
| [`configure`](#configure) | 配置全局参数（四化规则、亮度、分界点、安星算法） | `yearDivide?`, `mutagens?`, `algorithm?` 等 |
| [`convert_solar_time`](#convert_solar_time) | 将北京时间转换为真太阳时（Jean Meeus 算法） | `beijingTime`, `longitude`, `latitude?` |

---

### `get_astrolabe`

创建紫微斗数星盘。这是所有后续查询的基础 Tool——返回完整星盘数据和 `reconstructionKey`，供下游 Tool 重建星盘。

当提供 `longitude` 时，自动使用 Jean Meeus 天文算法将北京时间校正为出生地真太阳时。AI 可根据城市名自行推断经纬度（如北京 ≈ 116.4, 上海 ≈ 121.5），无需调用外部 API。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `dateType` | `"solar" \| "lunar"` | ✓ | 日期类型 |
| `date` | `string` | ✓ | 日期，格式 `YYYY-M-D`，如 `"2000-1-15"` |
| `timeIndex` | `number` | ✓ | 时辰索引，0-12（0=早子时, 12=晚子时） |
| `gender` | `"male" \| "female"` | ✓ | 性别 |
| `isLeapMonth` | `boolean` | | 是否闰月（仅农历），默认 `false` |
| `fixLeap` | `boolean` | | 是否修正闰月，默认 `true` |
| `longitude` | `number` | | 出生地经度（东经为正），提供后自动校正真太阳时 |
| `latitude` | `number` | | 出生地纬度（北纬为正） |
| `language` | `string` | | 输出语言，默认 `"zh-CN"`，支持 `zh-TW`/`en-US`/`ja-JP`/`ko-KR`/`vi-VN` |
| `astroType` | `"heaven" \| "earth" \| "human"` | | 星盘类型，默认 `"heaven"`（天盘） |
| `config` | `object` | | 本次查询的独立配置覆盖 |

### `get_horoscope`

基于 `reconstructionKey` 重建星盘，获取指定日期的运限信息（大限、小限、流年、流月、流日、流时）。`reconstructionKey` 从 [`get_astrolabe`](#get_astrolabe) 响应中直接获取。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `reconstructionKey` | `object` | ✓ | 星盘重建密钥 |
| `targetDate` | `string` | | 目标日期，格式 `YYYY-M-D`，默认当前日期 |
| `timeIndex` | `number` | | 目标时辰索引，0-12 |

### `get_palace_info`

获取星盘中指定宫位的详细信息（主星、辅星、杂耀、四化、天干地支、长生十二神等）。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `reconstructionKey` | `object` | ✓ | 星盘重建密钥 |
| `palace` | `string` | ✓ | 宫位名称（如 `"命宫"`）或索引（0-11） |

### `get_surrounded_palaces`

获取指定宫位的三方四正宫位数据（本宫 + 对宫 + 财帛位 + 官禄位），每个宫位包含完整的星耀和四化信息。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `reconstructionKey` | `object` | ✓ | 星盘重建密钥 |
| `palace` | `string` | ✓ | 宫位名称或索引 |

### `analyze_palace`

对指定宫位进行多维度综合检查。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `reconstructionKey` | `object` | ✓ | 星盘重建密钥 |
| `palace` | `string` | ✓ | 宫位名称或索引 |
| `hasStars` | `string[]` | | 检查是否包含所有指定星耀（AND 逻辑） |
| `hasOneOfStars` | `string[]` | | 检查是否包含任一指定星耀（OR 逻辑） |
| `notHaveStars` | `string[]` | | 检查是否不包含这些星耀 |
| `hasMutagen` | `string` | | 检查是否有特定四化（如 `"禄"`） |
| `isEmpty` | `object` | | 空宫判断，可指定 `excludeStars` 排除星耀列表 |
| `fliesTo` | `object` | | 检查本宫是否有星耀四化飞到目标宫位 |
| `selfMutaged` | `string[]` | | 检查是否有自化 |
| `getMutagedPlaces` | `boolean` | | 获取所有被本宫四化飞入的宫位列表 |

### `get_star_info`

获取指定星耀在星盘中的详细信息（亮度、四化、所在宫位、三方四正）。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `reconstructionKey` | `object` | ✓ | 星盘重建密钥 |
| `starName` | `string` | ✓ | 星耀名称 |

### `get_patterns`

检测星盘中命中的 41 种紫微斗数格局（上格/中格/助力格/恶格/基础格），每种格局返回级别、描述、古籍出处及匹配条件明细。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `reconstructionKey` | `object` | ✓ | 星盘重建密钥 |
| `category` | `"all" \| "superior" \| "middle" \| "support" \| "caution" \| "basic"` | | 按分类筛选，默认 `"all"` |

### `get_synastry`

对两人星盘进行合盘综合分析。需先通过 [`get_astrolabe`](#get_astrolabe) 分别获取两人的 `reconstructionKey`。

分析内容：
- 双方基本信息（命宫/夫妻宫/福德宫主星）
- 夫妻宫互映检测（甲方夫妻宫主星 vs 乙方命宫主星，反之亦然）
- 命格兼容性评分（1-5★，基于速判表）
- 太阳/太阴状态（女命查太阳、男命查太阴）
- 知识库引用（匹配的断语引用，含核心摘要）

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `reconstructionKeyA` | `object` | ✓ | 甲方星盘重建密钥 |
| `reconstructionKeyB` | `object` | ✓ | 乙方星盘重建密钥 |
| `synastryType` | `"romance" \| "career" \| "parenting"` | | 合盘类型，默认 `"romance"` |

### `get_heming_star`

查询特定十四主星在夫妻宫的合盘断语。不需要星盘，直接查询知识库。

返回内容：核心总结、吉象条件、凶象注意事项、配偶外形性格、婚期建议。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `starName` | `string` | ✓ | 十四主星名称，如 `"紫微"`、`"天府"` |

### `get_zodiac`

根据公历日期获取对应的十二生肖。轻量级独立查询，无需创建星盘。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `date` | `string` | ✓ | 公历日期，格式 `YYYY-M-D` |
| `language` | `string` | | 输出语言，默认 `"zh-CN"` |

### `get_sign`

根据日期获取西方星座（黄道十二宫）。支持公历和农历两种输入方式。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `dateType` | `"solar" \| "lunar"` | ✓ | 日期类型 |
| `date` | `string` | ✓ | 日期，格式 `YYYY-M-D` |
| `isLeapMonth` | `boolean` | | 是否闰月（仅农历），默认 `false` |
| `language` | `string` | | 输出语言，默认 `"zh-CN"` |

### `get_soul_major_stars`

获取命宫主星的简化查询。不需要创建完整星盘，直接返回命宫主星列表。若命宫为空宫则自动借对宫主星。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `dateType` | `"solar" \| "lunar"` | ✓ | 日期类型 |
| `date` | `string` | ✓ | 日期，格式 `YYYY-M-D` |
| `timeIndex` | `number` | ✓ | 时辰索引，0-12 |
| `isLeapMonth` | `boolean` | | 是否闰月，默认 `false` |
| `fixLeap` | `boolean` | | 是否修正闰月，默认 `true` |
| `language` | `string` | | 输出语言，默认 `"zh-CN"` |

### `configure`

配置服务器全局参数。修改后影响后续所有 Tool 调用。

| 参数 | 类型 | 说明 |
|------|------|------|
| `yearDivide` | `"normal" \| "exact"` | 年分割点：正月初一或立春 |
| `horoscopeDivide` | `"normal" \| "exact"` | 运限分割点：初一或节气 |
| `ageDivide` | `"normal" \| "birthday"` | 小限分割点：自然年或生日 |
| `dayDivide` | `"current" \| "forward"` | 晚子时处理：算当日或算次日 |
| `algorithm` | `"default" \| "zhongzhou"` | 安星算法：通用版本或中州派 |
| `mutagens` | `object` | 自定义四化规则 |
| `brightness` | `object` | 自定义星耀亮度 |
| `reset` | `boolean` | 重置为默认配置 |

### `convert_solar_time`

将北京时间根据经纬度转换为真太阳时，基于 Jean Meeus 天文算法。推荐直接使用 [`get_astrolabe`](#get_astrolabe) 的 `longitude` 参数让服务器自动完成转换。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `beijingTime` | `string` | ✓ | 北京时间，格式 `YYYY-MM-DD HH:mm:ss` |
| `longitude` | `number` | ✓ | 经度（东经为正，-180~180） |
| `latitude` | `number` | | 纬度（北纬为正，-90~90） |

---

## 可用资源

共 **14 个** MCP Resource：

### 合盘知识库

| 资源 | URI | 说明 |
|------|-----|------|
| 主星断语 | `iztro://heming/stars-in-fuqi-gu` | 十四主星在夫妻宫的完整断语（倪海夏体系） |
| 四化断语 | `iztro://heming/sihua-in-fuqi-gu` | 四化（化禄/权/科/忌）在夫妻宫的断语 |
| 核心方法论 | `iztro://heming/methodology` | 合盘核心方法论（双宫联参、五步法、婚期判断等） |
| 婚姻杂曜 | `iztro://heming/marriage-stars-brief` | 婚姻相关杂曜（红鸾、天喜、天姚等）简要断语 |
| 评分标准 | `iztro://heming/score-criteria` | 合盘评分标准（一星至五星）详细定义 |
| 兼容性速判 | `iztro://heming/compatibility` | 命格兼容性速判表（18 种典型主星组合） |

### 常量参考

| 资源 | URI | 说明 |
|------|-----|------|
| 星耀目录 | `iztro://constants/stars` | 所有星耀：14 主星 + 14 辅星 + 41 杂耀 + 12 长生神 |
| 宫位名称 | `iztro://constants/palace-names` | 十二宫加身宫的名称、索引和描述 |
| 十天干 | `iztro://constants/heavenly-stems` | 甲、乙、丙、丁、戊、己、庚、辛、壬、癸 |
| 十二地支 | `iztro://constants/earthly-branches` | 子、丑、寅、卯、辰、巳、午、未、申、酉、戌、亥 |
| 时辰对照 | `iztro://constants/time-periods` | 时辰索引与时间段对照表（0=早子时 ～ 12=晚子时） |
| 语言列表 | `iztro://constants/languages` | iztro 支持的多语言列表 |
| 配置参考 | `iztro://constants/config-reference` | 全局配置参数所有可选值及说明 |

### 知识库

| 资源 | URI | 说明 |
|------|-----|------|
| 格局知识 | `iztro://patterns/knowledge` | 全部 41 种格局的完整知识卡片（分类、级别、描述、古籍出处） |

---

## 使用流程

典型的紫微斗数查询流程如下：

```
1. get_astrolabe          → 创建星盘，获取 reconstructionKey
2. get_patterns           → 检测格局（上格/中格/恶格等）
3. get_palace_info        → 查询特定宫位详情
4. get_surrounded_palaces → 查看三方四正
5. get_star_info          → 查询特定星耀详情
6. analyze_palace         → 综合宫位分析（飞化、自化等）
7. get_horoscope          → 查看运限数据
8. get_synastry + get_heming_star → 合盘分析
```

### 请求示例

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
      "language": "zh-CN"
    }
  }
}
```

`reconstructionKey` 仅含 5 个字段（`dateType`/`date`/`timeIndex`/`gender`/`isLeapMonth`），从 [`get_astrolabe`](#get_astrolabe) 响应中直接复制即可传递给所有下游 Tool。

---

## 项目结构

```
ziwei-iztro-mcp/
├── src/
│   ├── index.ts                  # MCP 服务器主入口
│   ├── tools/                    # MCP Tool 定义（14 个）
│   │   ├── get-astrolabe.ts      # 星盘创建
│   │   ├── get-horoscope.ts      # 运限查询
│   │   ├── get-palace-info.ts    # 宫位信息
│   │   ├── get-star-info.ts      # 星耀信息
│   │   ├── get-surrounded-palaces.ts  # 三方四正
│   │   ├── analyze-palace.ts     # 综合宫位分析
│   │   ├── get-zodiac.ts         # 生肖查询
│   │   ├── get-sign.ts           # 星座查询
│   │   ├── get-soul-major-stars.ts   # 命宫主星
│   │   ├── configure.ts          # 全局配置
│   │   ├── convert-solar-time.ts # 真太阳时转换
│   │   ├── get-synastry.ts       # 合盘分析
│   │   ├── get-heming-star.ts    # 夫妻宫断语
│   │   └── get-patterns.ts       # 格局检测（41 种）
│   ├── schemas/                  # Zod Schema 定义
│   │   ├── astro.ts              # 星盘选项 Schema
│   │   ├── common.ts             # 重建密钥、语言、星盘数据 Schema
│   │   ├── heming.ts             # 合盘选项、星耀查询 Schema
│   │   ├── horoscope.ts          # 运限类型 Schema
│   │   ├── location.ts           # 真太阳时 Schema
│   │   └── palace.ts             # 宫位查询 Schema
│   ├── adapters/                 # iztro 适配层
│   │   ├── astro.ts              # 星盘创建适配器
│   │   ├── horoscope.ts          # 运限适配器
│   │   └── palace.ts             # 宫位适配器
│   ├── resources/                # MCP Resource 定义
│   │   ├── index.ts              # 所有 14 个 Resource 注册
│   │   ├── heming-knowledge.ts   # 合盘知识库（倪海夏体系）
│   │   └── patterns-knowledge.ts # 格局知识卡片（41 种）
│   └── utils/                    # 工具函数
│       ├── errors.ts             # 错误处理（分类、统一响应）
│       ├── format.ts             # 星盘/宫位/星耀格式化输出
│       └── solar-time.ts         # Jean Meeus 真太阳时算法
├── package.json
├── tsconfig.json
├── mcp-config.example.json       # MCP 配置示例
├── CHANGELOG.md
├── LICENSE
└── README.md
```

---

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| [TypeScript](https://www.typescriptlang.org/) | ^5.2.0 | 类型安全开发 |
| [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk) | ^1.0.0 | MCP 协议实现 |
| [Zod](https://zod.dev/) | ^4.0.0 | 运行时参数校验 |
| [iztro](https://www.npmjs.com/package/iztro) | latest | 紫微斗数核心计算库 |
| [tsx](https://www.npmjs.com/package/tsx) | ^4.0.0 | 开发模式热重载 |

---

## 许可证

[MIT](LICENSE)

---

© 2025 iztro Contributors
