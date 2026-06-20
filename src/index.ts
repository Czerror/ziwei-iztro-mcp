#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { getAstrolabeTool } from './tools/get-astrolabe.js';
import { getHoroscopeTool } from './tools/get-horoscope.js';
import { getPalaceInfoTool } from './tools/get-palace-info.js';
import { getStarInfoTool } from './tools/get-star-info.js';
import { getSurroundedPalacesTool } from './tools/get-surrounded-palaces.js';
import { analyzePalaceTool } from './tools/analyze-palace.js';
import { getZodiacTool } from './tools/get-zodiac.js';
import { getSignTool } from './tools/get-sign.js';
import { getSoulMajorStarsTool } from './tools/get-soul-major-stars.js';
import { configureTool } from './tools/configure.js';
import { convertSolarTimeTool } from './tools/convert-solar-time.js';
import { getSynastryTool } from './tools/get-synastry.js';
import { getHemingStarTool } from './tools/get-heming-star.js';
import { getPatternsTool } from './tools/get-patterns.js';
import { getWesternAstrolabeTool } from './tools/get-western-astrolabe.js';
import { getWesternScopeTool } from './tools/get-western-scope.js';
import { RESOURCES } from './resources/index.js';
import { toJSON } from './utils/format.js';

/** 所有 Tool 定义 */
const ALL_TOOLS = [
  getAstrolabeTool,
  getHoroscopeTool,
  getPalaceInfoTool,
  getStarInfoTool,
  getSurroundedPalacesTool,
  analyzePalaceTool,
  getZodiacTool,
  getSignTool,
  getSoulMajorStarsTool,
  configureTool,
  convertSolarTimeTool,
  getSynastryTool,
  getHemingStarTool,
  getPatternsTool,
  getWesternAstrolabeTool,
  getWesternScopeTool,
] as const;

/**
 * 创建并配置 MCP 服务器实例
 *
 * @returns 配置完成的 McpServer 实例（尚未连接 transport）
 */
function createServer(): McpServer {
  const server = new McpServer({
    name: 'ziwei-mcp',
    version: '0.1.0',
  });

  for (const tool of ALL_TOOLS) {
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: tool.inputSchema as never,
      },
      tool.handler as never,
    );
  }

  for (const resource of RESOURCES) {
    server.registerResource(
      resource.name,
      resource.uri,
      {
        description: resource.description,
        mimeType: resource.mimeType,
      },
      async (uri: URL) => ({
        contents: [
          {
            uri: uri.href,
            mimeType: resource.mimeType,
            text: toJSON(resource.data),
          },
        ],
      }),
    );
  }

  return server;
}

/**
 * MCP 服务器主入口
 *
 * 创建 McpServer 实例，注册全部 Tool 和 Resource，通过 stdio 传输启动。
 */
async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);
  console.error('ziwei-mcp 已启动 (v0.1.0)');
}

main().catch((error: unknown) => {
  console.error('致命错误:', error);
  process.exit(1);
});
