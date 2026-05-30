/**
 * 参数验证错误
 * 当 Zod Schema 验证失败时抛出
 */
export class ValidationError extends Error {
  /** 验证失败的字段路径列表 */
  readonly fieldPaths: string[];

  constructor(message: string, fieldPaths: string[] = []) {
    super(message);
    this.name = 'ValidationError';
    this.fieldPaths = fieldPaths;
  }
}

/**
 * iztro 业务逻辑错误
 * 当 iztro 核心库抛出异常时封装
 */
export class AstrolabeError extends Error {
  /** 原始错误 */
  readonly originalError: unknown;

  constructor(message: string, originalError?: unknown) {
    super(message);
    this.name = 'AstrolabeError';
    this.originalError = originalError;
  }
}

/**
 * 错误响应结构
 */
export interface ErrorResponse {
  content: Array<{ type: 'text'; text: string }>;
  isError: true;
}

/**
 * 统一错误处理函数
 * 分类处理 Zod 验证错误、iztro 业务错误和未知内部错误
 *
 * @param error 捕获的错误对象
 * @param toolName 发生错误的 Tool 名称
 * @returns 标准化的 MCP 错误响应
 */
export function handleError(error: unknown, toolName: string): ErrorResponse {
  if (error instanceof ValidationError) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              error: 'INVALID_PARAMETERS',
              tool: toolName,
              details: error.fieldPaths.map((path) => ({
                path,
                message: error.message,
              })),
            },
            null,
            2,
          ),
        },
      ],
      isError: true,
    };
  }

  if (error instanceof AstrolabeError) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              error: 'BUSINESS_ERROR',
              tool: toolName,
              message: error.message,
            },
            null,
            2,
          ),
        },
      ],
      isError: true,
    };
  }

  if (error instanceof Error) {
    const knownErrors: Record<string, string> = {
      'invalid star name.': '指定的星耀名称不存在',
    };

    const friendlyMessage = knownErrors[error.message] ?? error.message;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              error: 'BUSINESS_ERROR',
              tool: toolName,
              message: friendlyMessage,
            },
            null,
            2,
          ),
        },
      ],
      isError: true,
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            error: 'INTERNAL_ERROR',
            tool: toolName,
            message: '服务器内部错误，请稍后重试',
          },
          null,
          2,
        ),
      },
    ],
    isError: true,
  };
}
