// 重试工具 - 指数退避重试机制

/**
 * 带有指数退避的重试函数
 * @param fn 需要重试的异步函数
 * @param maxRetries 最大重试次数（默认 2 次）
 * @param baseDelay 基础延迟时间（毫秒，默认 1000ms）
 * @returns 函数执行结果
 */
export async function retryBack<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // 如果是最后一次尝试，抛出错误
      if (attempt === maxRetries) {
        throw lastError;
      }

      // 计算延迟时间（指数退避）
      const delay = baseDelay * Math.pow(2, attempt);

      // 等待延迟时间
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // 理论上不会到达这里，但为了类型安全
  throw lastError;
}

/**
 * 带有重试的 HTTPS 请求包装器
 * @param options HTTPS 请求选项
 * @param data 请求数据
 * @param maxRetries 最大重试次数
 * @returns 响应数据
 */
export async function retryReq(
  options: any,
  data: string,
  maxRetries: number = 2
): Promise<any> {
  return retryBack(async () => {
    return new Promise((resolve, reject) => {
      const https = require('https');
      const req = https.request(options, (res: any) => {
        let responseData = '';

        res.on('data', (chunk: any) => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            const json = JSON.parse(responseData);
            if (res.statusCode === 200) {
              resolve(json);
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(json)}`));
            }
          } catch (e) {
            reject(new Error(`解析响应失败: ${responseData}`));
          }
        });
      });

      req.on('error', (error: Error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('请求超时'));
      });

      req.write(data);
      req.end();
    });
  }, maxRetries);
}
