// API速率限制器 - 控制高德地图API的并发请求数
class ApiRateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private runningCount: number = 0;
  private maxConcurrent: number;
  private minInterval: number; // 最小间隔（毫秒）
  private lastRequestTime: number = 0;

  constructor(maxConcurrent: number = 3, minInterval: number = 350) {
    this.maxConcurrent = maxConcurrent;
    this.minInterval = minInterval; // 确保每秒最多3次（1000ms / 3 ≈ 333ms）
  }

  /**
   * 执行一个异步任务，受速率限制控制
   * @param task 要执行的异步任务
   * @returns 任务执行结果
   */
  async exec<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.flushQ();
    });
  }

  /**
   * 处理队列中的任务
   */
  private async flushQ(): Promise<void> {
    // 如果没有任务、正在运行的任务已达上限、或者距离上次请求时间太短，则不处理
    if (
      this.queue.length === 0 ||
      this.runningCount >= this.maxConcurrent ||
      Date.now() - this.lastRequestTime < this.minInterval
    ) {
      return;
    }

    // 取出队列中的第一个任务
    const task = this.queue.shift();
    if (!task) return;

    this.runningCount++;
    this.lastRequestTime = Date.now();

    try {
      await task();
    } finally {
      this.runningCount--;
      // 任务完成后，继续处理队列
      setTimeout(() => this.flushQ(), this.minInterval);
    }
  }
}

// 创建全局单例实例
export const amapRateLimiter = new ApiRateLimiter(3, 350); // 最大并发3次，最小间隔350ms
