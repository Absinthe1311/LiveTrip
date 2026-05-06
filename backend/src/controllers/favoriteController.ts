// 收藏控制器 - 处理收藏相关的API请求
import { Request, Response } from 'express';
import {
  listFavs,
  favsWithData,
  addFav,
  delFav,
  isFaved,
  favCount,
} from '../services/favoriteService';

/**
 * 获取收藏列表
 * GET /api/favorites
 */
export const myFavs = async (req: Request, res: Response) => {
  try {
    const userId = (req.headers['x-user-id'] as string) || 'default-user';
    const includeIoT = req.query.includeIoT === 'true';


    let favorites;
    if (includeIoT) {
      favorites = await favsWithData(userId);
    } else {
      favorites = await listFavs(userId);
    }

    res.json({
      success: true,
      data: favorites,
      count: favorites.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || '获取收藏列表失败',
    });
  }
};

/**
 * 添加收藏
 * POST /api/favorites
 */
export const addFavCtrl = async (req: Request, res: Response) => {
  try {
    const { spotId, notes } = req.body;
    const userId = (req.headers['x-user-id'] as string) || 'default-user';

    if (!spotId) {
      return res.status(400).json({
        success: false,
        error: '缺少景点ID',
      });
    }


    const favorite = await addFav(spotId, userId, notes);

    res.json({
      success: true,
      data: favorite,
      message: '收藏成功',
    });
  } catch (error: any) {

    if (error.message === '景点不存在') {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    if (error.message === '已经收藏过该景点') {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || '添加收藏失败',
    });
  }
};

/**
 * 取消收藏
 * DELETE /api/favorites/:spotId
 */
export const delFavCtrl = async (req: Request, res: Response) => {
  try {
    const { spotId } = req.params;
    const userId = (req.headers['x-user-id'] as string) || 'default-user';


    await delFav(spotId.toString(), userId);

    res.json({
      success: true,
      message: '取消收藏成功',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || '取消收藏失败',
    });
  }
};

/**
 * 检查是否已收藏
 * GET /api/favorites/check/:spotId
 */
export const chkFav = async (req: Request, res: Response) => {
  try {
    const { spotId } = req.params;
    const userId = (req.headers['x-user-id'] as string) || 'default-user';


    const isFavorited = await isFaved(spotId.toString(), userId);

    res.json({
      success: true,
      data: {
        isFavorited,
        spotId,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || '检查收藏状态失败',
    });
  }
};

/**
 * 获取收藏数量
 * GET /api/favorites/count
 */
export const myFavsCount = async (req: Request, res: Response) => {
  try {
    const userId = (req.headers['x-user-id'] as string) || 'default-user';


    const count = await favCount(userId);

    res.json({
      success: true,
      data: {
        count,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || '获取收藏数量失败',
    });
  }
};
