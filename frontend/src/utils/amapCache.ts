/**
 * 高德地图API缓存工具
 * 用于缓存API调用结果,减少API调用次数
 */

const CACHE_PREFIX = 'amap_cache_';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 一周(毫秒)

interface CacheItem {
  data: any;
  timestamp: number;
}

/**
 * 生成缓存键
 */
function getCacheKey(type: string, ...params: any[]): string {
  return `${CACHE_PREFIX}${type}_${params.map(p => String(p)).join('_')}`;
}

/**
 * 设置缓存
 */
export function setCache(type: string, params: any[], data: any): void {
  const key = getCacheKey(type, ...params);
  const item: CacheItem = {
    data,
    timestamp: Date.now(),
  };

  try {
    localStorage.setItem(key, JSON.stringify(item));
    console.log(`✅ 缓存已保存: ${key}`);
  } catch (error) {
    console.error('缓存保存失败:', error);
    // 如果存储空间不足,清理过期缓存
    cleanExpiredCache();
  }
}

/**
 * 获取缓存
 */
export function getCache(type: string, params: any[]): any | null {
  const key = getCacheKey(type, ...params);

  try {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) {
      return null;
    }

    const item: CacheItem = JSON.parse(itemStr);
    const now = Date.now();

    // 检查是否过期
    if (now - item.timestamp > CACHE_DURATION) {
      console.log(`⏰ 缓存已过期: ${key}`);
      localStorage.removeItem(key);
      return null;
    }

    console.log(`✅ 缓存命中: ${key}`);
    return item.data;
  } catch (error) {
    console.error('缓存读取失败:', error);
    return null;
  }
}

/**
 * 清理过期缓存
 */
export function cleanExpiredCache(): void {
  console.log('🧹 开始清理过期缓存...');

  const now = Date.now();
  let cleaned = 0;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(CACHE_PREFIX)) {
      try {
        const itemStr = localStorage.getItem(key);
        if (itemStr) {
          const item: CacheItem = JSON.parse(itemStr);
          if (now - item.timestamp > CACHE_DURATION) {
            localStorage.removeItem(key);
            cleaned++;
          }
        }
      } catch (error) {
        // 如果解析失败,直接删除
        localStorage.removeItem(key);
        cleaned++;
      }
    }
  }

  console.log(`✅ 清理完成,删除了 ${cleaned} 个过期缓存`);
}

/**
 * 清理所有缓存
 */
export function clearAllCache(): void {
  console.log('🧹 清理所有高德地图缓存...');

  const keysToDelete: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(CACHE_PREFIX)) {
      keysToDelete.push(key);
    }
  }

  keysToDelete.forEach(key => localStorage.removeItem(key));
  console.log(`✅ 清理完成,删除了 ${keysToDelete.length} 个缓存`);
}

/**
 * 获取缓存统计信息
 */
export function getCacheStats(): { total: number; expired: number; valid: number } {
  const now = Date.now();
  let total = 0;
  let expired = 0;
  let valid = 0;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(CACHE_PREFIX)) {
      total++;
      try {
        const itemStr = localStorage.getItem(key);
        if (itemStr) {
          const item: CacheItem = JSON.parse(itemStr);
          if (now - item.timestamp > CACHE_DURATION) {
            expired++;
          } else {
            valid++;
          }
        }
      } catch (error) {
        expired++;
      }
    }
  }

  return { total, expired, valid };
}
