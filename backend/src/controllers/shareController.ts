/**
 * 分享控制器
 * 处理行程分享相关的HTTP请求
 */

import { Request, Response } from 'express';
import { shareLink, publicTrip, forkTrip } from '../services/shareService';

/**
 * 分享行程
 * POST /api/trips/:id/share
 */
export const shareTrip = async (req: Request, res: Response) => {
  try {

    // 获取行程ID
    const { id } = req.params;
    const tripId = Array.isArray(id) ? id[0] : id;

    // 获取用户ID (从请求头)
    const userIdHeader = req.headers['x-user-id'];
    const userId = Array.isArray(userIdHeader) ? userIdHeader[0] : userIdHeader || 'default-user';


    // 调用服务生成分享链接
    const result = await shareLink(tripId, userId);


    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {

    // 根据错误类型返回不同的HTTP状态码
    if (error.message === '行程不存在') {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    if (error.message === '无权限分享此行程') {
      return res.status(403).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || '分享失败,请稍后重试',
    });
  }
};

/**
 * 获取公开行程
 * GET /api/trips/shared/:token
 */
export const getSharedTrip = async (req: Request, res: Response) => {
  try {

    // 获取token
    const { token } = req.params;
    const shareToken = Array.isArray(token) ? token[0] : token;


    // 调用服务获取公开行程
    const trip = await publicTrip(shareToken);


    res.json({
      success: true,
      data: trip,
    });
  } catch (error: any) {

    // 根据错误类型返回不同的HTTP状态码
    if (error.message === '分享链接无效或行程不存在' || error.message === '该行程未公开分享') {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || '获取行程失败,请稍后重试',
    });
  }
};

/**
 * 复刻公开行程
 * POST /api/trips/shared/:token/clone
 */
export const copyTrip = async (req: Request, res: Response) => {
  try {

    // 获取token
    const { token } = req.params;
    const shareToken = Array.isArray(token) ? token[0] : token;

    // 获取用户ID (从请求头,需要登录)
    const userIdHeader = req.headers['x-user-id'];
    const userId = Array.isArray(userIdHeader) ? userIdHeader[0] : userIdHeader;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '请先登录',
      });
    }


    // 调用服务复刻行程
    const result = await forkTrip(shareToken, userId);


    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error: any) {

    // 根据错误类型返回不同的HTTP状态码
    if (error.message === '原行程不存在') {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    if (error.message === '该行程未公开分享,无法复刻') {
      return res.status(403).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || '复刻失败,请稍后重试',
    });
  }
};
