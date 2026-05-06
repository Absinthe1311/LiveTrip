// 收藏服务 - 处理景点的收藏功能
import { getPrismaClient } from '../lib/prisma';

const prisma = getPrismaClient();

export interface FavoriteSpot {
  id: string;
  spotId: string;
  userId: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  spot: {
    id: string;
    amapId: string;
    name: string;
    location: string;
    address: string | null;
    city: string;
    category: string | null;
    ticketPrice: number | null;
    openTime: string | null;
    rating: number | null;
    description: string | null;
    isOutdoor: boolean | null;
    source: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

export interface FavoriteSpotWithIoT extends FavoriteSpot {
  iotData?: {
    id: string;
    spotId: string;
    crowdLevel: number;
    temperature: number;
    rainProbability: number;
    isOpen: boolean;
    generatedAt: Date;
    updatedAt: Date;
  };
}

/**
 * 获取用户的所有收藏景点
 */
export async function listFavs(userId: string = 'default-user'): Promise<FavoriteSpot[]> {
  try {
    const favorites = await prisma.favorite.findMany({
      where: {
        userId,
      },
      include: {
        spot: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return favorites;
  } catch (error) {
    throw error;
  }
}

/**
 * 获取用户的所有收藏景点（包含IoT数据）
 */
export async function favsWithData(
  userId: string = 'default-user'
): Promise<FavoriteSpotWithIoT[]> {
  try {
    const favorites = await prisma.favorite.findMany({
      where: {
        userId,
      },
      include: {
        spot: {
          include: {
            iotData: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return favorites;
  } catch (error) {
    throw error;
  }
}

/**
 * 添加收藏
 */
export async function addFav(
  spotId: string,
  userId: string = 'default-user',
  notes?: string
): Promise<FavoriteSpot> {
  try {
    // 检查是否存在该景点
    const spot = await prisma.spot.findUnique({
      where: {
        id: spotId,
      },
    });

    if (!spot) {
      throw new Error('景点不存在');
    }

    // 验证坐标是否有效
    const isLocationValid =
      spot.location &&
      spot.location !== '0,0' &&
      spot.location !== '0, 0,0' &&
      spot.location !== '';
    if (!isLocationValid) {

      try {
        // 尝试从高德地图API获取正确的坐标
        const { getAmapService } = await import('./amapService');
        const amapService = getAmapService();

        const searchResults = await amapService.getAttractions(spot.city, spot.name, '', 1);

        if (searchResults && searchResults.length > 0) {
          const validSpot = searchResults[0];
          if (validSpot.location && validSpot.location !== '0,0') {

            // 更新数据库中的坐标
            await prisma.spot.update({
              where: { id: spotId },
              data: {
                location: validSpot.location,
                address: validSpot.address || spot.address,
              },
            });

          } else {
          }
        } else {
        }
      } catch (error) {
      }
    }

    // 检查是否已经收藏
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        spotId_userId: {
          spotId,
          userId,
        },
      },
    });

    if (existingFavorite) {
      throw new Error('已经收藏过该景点');
    }

    // 创建收藏
    const favorite = await prisma.favorite.create({
      data: {
        spotId,
        userId,
        notes: notes || '',
      },
      include: {
        spot: true,
      },
    });

    return favorite;
  } catch (error) {
    throw error;
  }
}

/**
 * 取消收藏
 */
export async function delFav(
  spotId: string,
  userId: string = 'default-user'
): Promise<void> {
  try {
    await prisma.favorite.delete({
      where: {
        spotId_userId: {
          spotId,
          userId,
        },
      },
    });
  } catch (error) {
    throw error;
  }
}

/**
 * 检查是否已收藏
 */
export async function isFaved(
  spotId: string,
  userId: string = 'default-user'
): Promise<boolean> {
  try {
    const favorite = await prisma.favorite.findUnique({
      where: {
        spotId_userId: {
          spotId,
          userId,
        },
      },
    });

    return !!favorite;
  } catch (error) {
    throw error;
  }
}

/**
 * 获取收藏数量
 */
export async function favCount(userId: string = 'default-user'): Promise<number> {
  try {
    const count = await prisma.favorite.count({
      where: {
        userId,
      },
    });

    return count;
  } catch (error) {
    throw error;
  }
}
