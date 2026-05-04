/**
 * AI辅助生成
 * 时间：2026-05-04
 * 环节：服务层重构
 */

// 高德地图 API 服务封装
import axios, { AxiosInstance } from 'axios';
import { amapPOICacheService } from './amapPOICacheService';

// 景点接口定义
export interface AmapAttraction {
  name: string;
  location: string; // 经纬度 "116.397428,39.90923"
  address: string;
  type: string;
  typecode: string;
  tel?: string;
  distance?: string;
  rating?: number;
  cost?: string;
}

// 高德 POI 搜索响应接口
interface AmapPOIResponse {
  status: string;
  info: string;
  infocode: string;
  count: string;
  pois: Array<{
    id: string;
    name: string;
    type: string;
    typecode: string;
    address: string;
    location: string;
    tel?: string;
    distance?: string;
    biz_ext?: {
      rating?: string;
      cost?: string;
    };
  }>;
}

class AmapService {
  private baseURL: string;
  private client: AxiosInstance;

  constructor() {
    this.baseURL = 'https://restapi.amap.com/v3';

    // 延迟读取环境变量
    const apiKey = process.env.AMAP_API_KEY || '';

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      params: {
        key: apiKey,
      },
    });

    if (!apiKey) {
      console.warn('⚠️  AMAP_API_KEY 未配置，高德地图 API 调用将失败');
    } else {
      console.log('✅ AMAP_API_KEY 已配置');
    }
  }

  /**
   * 获取目的地景点列表
   * @param city 城市名称（如"北京"、"上海"）
   * @param keywords 搜索关键词（如"景点"、"博物馆"）
   * @param types POI 类型代码，多个用"|"分隔
   * @param pageSize 每页数量，默认20
   * @returns 景点列表
   */
  async getAttractions(
    city: string,
    keywords: string = '景点',
    types: string = '110000|140000|050000', // 风景名胜|旅游景点|餐饮服务
    pageSize: number = 20
  ): Promise<AmapAttraction[]> {
    try {
      console.log(
        `📡 [高德API] 关键字搜索 - 城市: ${city}, 关键词: ${keywords}, 类型: ${types}, 用途: 获取景点数据`
      );

      const params: Record<string, any> = {
        keywords: keywords || '景点',
        offset: pageSize,
        page: 1,
        extensions: 'all', // 获取详细信息（包含评分等）
      };

      // 如果types不为空，添加types参数
      if (types && types.trim() !== '') {
        params.types = types;
      }

      // 如果city不为空，添加city参数
      if (city && city.trim() !== '') {
        params.city = city;
      }

      console.log(`🔍 高德API请求参数:`, JSON.stringify(params, null, 2));

      const response = await this.client.get<AmapPOIResponse>('/place/text', {
        params,
      });

      console.log(
        `📊 高德API响应状态: ${response.data.status}, 信息: ${response.data.info}, 数量: ${response.data.count}`
      );

      if (response.data.status !== '1') {
        throw new Error(`高德 API 错误: ${response.data.info} (${response.data.infocode})`);
      }

      const pois = response.data.pois || [];
      console.log(`✅ [高德API] 关键字搜索成功 - 返回 ${pois.length} 个结果`);

      // 转换为统一格式
      const attractions: AmapAttraction[] = pois.map((poi) => ({
        name: poi.name,
        location: poi.location,
        address: poi.address,
        type: poi.type,
        typecode: poi.typecode,
        tel: poi.tel && typeof poi.tel === 'string' ? poi.tel : undefined,
        distance: poi.distance && typeof poi.distance === 'string' ? poi.distance : undefined,
        rating: poi.biz_ext?.rating ? parseFloat(poi.biz_ext.rating) : undefined,
        cost: poi.biz_ext?.cost,
      }));

      return attractions;
    } catch (error) {
      console.error('❌ [高德API] 关键字搜索失败:', error);
      throw error;
    }
  }

  /**
   * 根据类型搜索景点
   * @param city 城市名称
   * @param typeCode POI 类型代码
   * @returns 景点列表
   */
  async getAttractionsByType(city: string, typeCode: string): Promise<AmapAttraction[]> {
    return this.getAttractions(city, '', typeCode);
  }

  /**
   * 搜索餐厅
   * @param city 城市名称
   * @returns 餐厅列表
   */
  async getRestaurants(city: string): Promise<AmapAttraction[]> {
    return this.getAttractionsByType(city, '050000');
  }

  /**
   * 搜索风景名胜
   * @param city 城市名称
   * @returns 风景名胜列表
   */
  async getScenicSpots(city: string): Promise<AmapAttraction[]> {
    return this.getAttractionsByType(city, '110000');
  }

  /**
   * 搜索旅游景点
   * @param city 城市名称
   * @returns 旅游景点列表
   */
  async getTouristAttractions(city: string): Promise<AmapAttraction[]> {
    return this.getAttractionsByType(city, '140000');
  }

  /**
   * 获取多种类型的景点（综合搜索）- 带缓存
   * @param city 城市名称
   * @returns 景点列表（包含风景名胜、旅游景点、餐厅）
   */
  async getAllAttractions(city: string): Promise<AmapAttraction[]> {
    try {
      // 首先尝试从缓存获取
      console.log(`📦 尝试从缓存获取 ${city} 的景点数据...`);
      const cachedAttractions = await amapPOICacheService.getFromCache(city);

      if (cachedAttractions && cachedAttractions.length > 0) {
        console.log(`✅ 从缓存获取成功，共 ${cachedAttractions.length} 个景点`);
        return cachedAttractions;
      }

      console.log(`📭 缓存中没有数据，调用高德地图 API...`);

      // 并发获取多种类型的景点
      const [scenicSpots, touristAttractions, restaurants] = await Promise.all([
        this.getScenicSpots(city).catch((e) => {
          console.warn('获取风景名胜失败:', e.message);
          return [];
        }),
        this.getTouristAttractions(city).catch((e) => {
          console.warn('获取旅游景点失败:', e.message);
          return [];
        }),
        this.getRestaurants(city).catch((e) => {
          console.warn('获取餐厅失败:', e.message);
          return [];
        }),
      ]);

      // 合并结果并去重（根据名称和位置）
      const allAttractions = [...scenicSpots, ...touristAttractions, ...restaurants];
      const uniqueAttractions = this.deduplicateAttractions(allAttractions);

      console.log(`✅ 综合搜索完成，共 ${uniqueAttractions.length} 个不重复的景点`);

      // 保存到缓存
      if (uniqueAttractions.length > 0) {
        await amapPOICacheService.saveToCache(uniqueAttractions, city);
      }

      return uniqueAttractions;
    } catch (error) {
      console.error('❌ 综合搜索失败:', error);
      throw error;
    }
  }

  /**
   * 周边搜索 - 根据中心点坐标搜索周边POI
   * @param location 中心点坐标 "116.397428,39.90923"
   * @param keywords 搜索关键词（如"酒店"、"餐厅"）
   * @param types POI类型代码（可选）
   * @param radius 搜索半径，单位：米，默认3000
   * @param pageSize 每页数量，默认20
   * @returns POI列表
   */
  async searchAround(
    location: string,
    keywords: string,
    types?: string,
    radius: number = 3000,
    pageSize: number = 20
  ): Promise<AmapAttraction[]> {
    try {
      console.log(
        `📡 [高德API] 周边搜索 - 关键词: ${keywords}, 中心点: ${location}, 半径: ${radius}m, 用途: ${keywords === '酒店' ? '酒店推荐' : keywords === '餐厅' ? '餐厅推荐' : '周边搜索'}`
      );

      const params: Record<string, any> = {
        location: location,
        keywords: keywords,
        radius: radius,
        offset: pageSize,
        page: 1,
        extensions: 'all', // 获取详细信息
      };

      // 只有当types有值时才添加（酒店搜索不使用types，因为高德的typecode可能不匹配）
      if (types && types !== '100101') {
        params.types = types;
      }

      const response = await this.client.get<AmapPOIResponse>('/place/around', {
        params,
      });

      if (response.data.status !== '1') {
        throw new Error(`高德 API 错误: ${response.data.info} (${response.data.infocode})`);
      }

      const pois = response.data.pois || [];
      console.log(`✅ [高德API] 周边搜索成功 - 返回 ${pois.length} 个结果`);

      // 转换为统一格式
      const attractions: AmapAttraction[] = pois.map((poi) => ({
        name: poi.name,
        location: poi.location,
        address: poi.address,
        type: poi.type,
        typecode: poi.typecode,
        tel: poi.tel && typeof poi.tel === 'string' ? poi.tel : undefined,
        distance: poi.distance && typeof poi.distance === 'string' ? poi.distance : undefined,
        rating: poi.biz_ext?.rating ? parseFloat(poi.biz_ext.rating) : undefined,
        cost: poi.biz_ext?.cost,
      }));

      return attractions;
    } catch (error) {
      console.error('❌ [高德API] 周边搜索失败:', error);
      throw error;
    }
  }

  /**
   * 去重景点（根据名称和位置）
   * @param attractions 景点列表
   * @returns 去重后的景点列表
   */
  private deduplicateAttractions(attractions: AmapAttraction[]): AmapAttraction[] {
    const seen = new Set<string>();
    return attractions.filter((attraction) => {
      const key = `${attraction.name}-${attraction.location}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * 解析经纬度字符串
   * @param location 经纬度字符串 "116.397428,39.90923"
   * @returns 经纬度对象 { lng, lat }
   */
  parseLocation(location: string): { lng: number; lat: number } {
    const [lng, lat] = location.split(',').map(Number);
    return { lng, lat };
  }

  /**
   * 计算两个经纬度之间的距离（单位：公里）
   * 使用 Haversine 公式
   */
  calculateDistance(location1: string, location2: string): number {
    const { lng: lng1, lat: lat1 } = this.parseLocation(location1);
    const { lng: lng2, lat: lat2 } = this.parseLocation(location2);

    const R = 6371; // 地球半径（公里）
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 100) / 100; // 保留两位小数
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

// 导出工厂函数
export const getAmapService = (): AmapService => {
  return new AmapService();
};

// 向后兼容的单例导出（延迟初始化）
let amapServiceInstance: AmapService | null = null;
export const amapService = (): AmapService => {
  if (!amapServiceInstance) {
    amapServiceInstance = new AmapService();
  }
  return amapServiceInstance;
};
