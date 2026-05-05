// 缓存管理器 - 用于缓存API数据，避免频繁请求
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresIn: number; // 过期时间（毫秒）
}

class CacheManager {
  private cache: Map<string, CacheItem<any>> = new Map();

  /**
   * 设置缓存
   * @param key 缓存键
   * @param data 缓存数据
   * @param expiresIn 过期时间（毫秒），默认5分钟
   */
  set<T>(key: string, data: T, expiresIn: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn,
    });
  }

  /**
   * 获取缓存
   * @param key 缓存键
   * @returns 缓存数据，如果不存在或已过期则返回null
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // 检查是否过期
    if (Date.now() - item.timestamp > item.expiresIn) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  /**
   * 检查缓存是否存在且未过期
   * @param key 缓存键
   */
  has(key: string): boolean {
    const item = this.cache.get(key);

    if (!item) {
      return false;
    }

    // 检查是否过期
    if (Date.now() - item.timestamp > item.expiresIn) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * 删除缓存
   * @param key 缓存键
   */
  del(key: string): void {
    this.cache.delete(key);
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存信息
   * @param key 缓存键
   */
  getInfo(key: string): { exists: boolean; age: number; expiresIn: number } | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    return {
      exists: true,
      age: Date.now() - item.timestamp,
      expiresIn: item.expiresIn,
    };
  }

  /**
   * 获取或设置缓存（如果缓存不存在或已过期，则调用fetcher获取数据并缓存）
   * @param key 缓存键
   * @param fetcher 数据获取函数
   * @param expiresIn 过期时间（毫秒）
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    expiresIn: number = 5 * 60 * 1000
  ): Promise<T> {
    // 尝试从缓存获取
    const cached = this.get<T>(key);
    if (cached !== null) {
      console.log(`✅ 从缓存获取数据: ${key}`);
      return cached;
    }

    // 缓存不存在或已过期，调用fetcher获取数据
    console.log(`🔄 缓存不存在或已过期，重新获取数据: ${key}`);
    const data = await fetcher();

    // 缓存数据
    this.set(key, data, expiresIn);
    console.log(`💾 数据已缓存: ${key}, 过期时间: ${expiresIn / 1000}秒`);

    return data;
  }
}

// 导出单例
export const cacheManager = new CacheManager();

// 缓存键常量
export const CACHE_KEYS = {
  USER_TRIPS: 'homepage:user_trips',
  IOT_DATA: 'homepage:iot_data',
  HOT_DESTINATIONS: 'homepage:hot_destinations',
  WEATHER_DATA: (city: string) => `homepage:weather:${city}`,
  PACKING_LIST: (tripId: string) => `homepage:packing:${tripId}`,
  BUDGET_DATA: (tripId: string) => `homepage:budget:${tripId}`,
} as const;

// 缓存过期时间常量（毫秒）
export const CACHE_TTL = {
  SHORT: 1 * 60 * 1000, // 1分钟
  MEDIUM: 5 * 60 * 1000, // 5分钟
  LONG: 30 * 60 * 1000, // 30分钟
  VERY_LONG: 60 * 60 * 1000, // 1小时
} as const;
