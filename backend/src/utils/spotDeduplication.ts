// 景点去重工具函数
import { AmapAttraction } from '../services/amapService';

/**
 * 计算两个字符串的相似度（Levenshtein距离）
 * @param str1 字符串1
 * @param str2 字符串2
 * @returns 相似度 0-1
 */
export function calcSim(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;

  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1;

  const len1 = s1.length;
  const len2 = s2.length;

  // 创建距离矩阵
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // 填充矩阵
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // 删除
        matrix[i][j - 1] + 1, // 插入
        matrix[i - 1][j - 1] + cost // 替换
      );
    }
  }

  const maxLen = Math.max(len1, len2);
  const distance = matrix[len1][len2];

  return 1 - distance / maxLen;
}

/**
 * 计算两个经纬度坐标之间的距离（米）
 * @param loc1 经纬度字符串 "116.397428,39.90923"
 * @param loc2 经纬度字符串 "116.397428,39.90923"
 * @returns 距离（米）
 */
export function calcDist(loc1: string, loc2: string): number {
  if (!loc1 || !loc2) return Infinity;

  const [lng1, lat1] = loc1.split(',').map(Number);
  const [lng2, lat2] = loc2.split(',').map(Number);

  if (isNaN(lng1) || isNaN(lat1) || isNaN(lng2) || isNaN(lat2)) {
    return Infinity;
  }

  // 使用 Haversine 公式计算球面距离
  const R = 6371000; // 地球半径（米）
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * 角度转弧度
 */
function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * 判断两个景点名称是否为父子关系
 * @param name1 景点名称1
 * @param name2 景点名称2
 * @returns 是否为父子关系
 */
export function isParent(name1: string, name2: string): boolean {
  // 检查是否包含分隔符
  const separators = ['-', '—', '–', '·', '·', '（', '(', ' '];

  for (const sep of separators) {
    if (name1.includes(sep) || name2.includes(sep)) {
      // 提取父名称
      const parent1 = name1.split(sep)[0].trim();
      const parent2 = name2.split(sep)[0].trim();

      // 如果父名称相同，则为父子关系
      if (parent1 === parent2 && parent1.length > 0) {
        return true;
      }

      // 如果一个名称是另一个的父名称
      if (name1.startsWith(parent2) || name2.startsWith(parent1)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * 判断两个景点是否为重复景点
 * @param spot1 景点1
 * @param spot2 景点2
 * @param options 配置选项
 * @returns 是否重复
 */
export function isDup(
  spot1: AmapAttraction,
  spot2: AmapAttraction,
  options: {
    nameSimilarityThreshold?: number;
    distanceThreshold?: number;
  } = {}
): boolean {
  const {
    nameSimilarityThreshold = 0.8,
    distanceThreshold = 500, // 500米
  } = options;

  // 1. 名称完全相同（忽略大小写和空格）
  const name1 = spot1.name.toLowerCase().replace(/\s+/g, '');
  const name2 = spot2.name.toLowerCase().replace(/\s+/g, '');

  if (name1 === name2) {
    return true;
  }

  // 2. 名称相似度高且距离近
  const similarity = calcSim(spot1.name, spot2.name);
  const distance = calcDist(spot1.location, spot2.location);

  if (similarity > nameSimilarityThreshold && distance < distanceThreshold) {
    return true;
  }

  // 3. 检查是否为父子景点关系（如"故宫博物院"和"故宫博物院-午门"）
  // 直接删除子景点，保留父景点
  if (isParent(spot1.name, spot2.name)) {
    return true;
  }

  return false;
}

/**
 * 景点去重
 * @param attractions 景点列表
 * @param options 配置选项
 * @returns 去重后的景点列表
 */
export function uniq(
  attractions: AmapAttraction[],
  options: {
    nameSimilarityThreshold?: number;
    distanceThreshold?: number;
  } = {}
): AmapAttraction[] {
  const result: AmapAttraction[] = [];
  const duplicates: Set<number> = new Set();

  for (let i = 0; i < attractions.length; i++) {
    if (duplicates.has(i)) continue;

    const current = attractions[i];
    result.push(current);

    // 标记后续的重复景点
    for (let j = i + 1; j < attractions.length; j++) {
      if (duplicates.has(j)) continue;

      if (isDup(current, attractions[j], options)) {
        duplicates.add(j);
        console.log(`🔄 去重: "${attractions[j].name}" 与 "${current.name}" 重复，已移除`);
      }
    }
  }

  console.log(
    `✅ 去重完成: ${attractions.length} -> ${result.length} (移除 ${attractions.length - result.length} 个重复景点)`
  );

  return result;
}
