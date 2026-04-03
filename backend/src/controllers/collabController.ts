// 协同规划控制器 - 处理协同规划相关的HTTP请求
import { Request, Response } from 'express';
import { collabService } from '../services/collabService';
import { broadcastToRoom } from '../socket/socketService';

/**
 * 创建协同房间
 * POST /api/collab/rooms
 */
export const createRoom = async (req: Request, res: Response) => {
  try {
    const { tripId } = req.body;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '未授权，请先登录',
      });
    }

    if (!tripId) {
      return res.status(400).json({
        success: false,
        error: '缺少行程ID',
      });
    }

    const result = await collabService.createRoom(tripId, userId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('❌ 创建协同房间失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '创建协同房间失败',
    });
  }
};

/**
 * 加入协同房间
 * POST /api/collab/rooms/join
 */
export const joinRoom = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '未授权，请先登录',
      });
    }

    if (!token) {
      return res.status(400).json({
        success: false,
        error: '缺少邀请token',
      });
    }

    const room = await collabService.joinRoom(token, userId);

    res.json({
      success: true,
      data: room,
    });
  } catch (error: any) {
    console.error('❌ 加入协同房间失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '加入协同房间失败',
    });
  }
};

/**
 * 获取房间信息
 * GET /api/collab/rooms/:roomId
 */
export const getRoomInfo = async (req: Request, res: Response) => {
  try {
    const roomId = req.params.roomId as string;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '未授权，请先登录',
      });
    }

    // 检查用户是否是房间成员
    const isMember = await collabService.isMember(roomId, userId);
    if (!isMember) {
      return res.status(403).json({
        success: false,
        error: '无权访问该房间',
      });
    }

    const room = await collabService.getRoomInfo(roomId);

    res.json({
      success: true,
      data: room,
    });
  } catch (error: any) {
    console.error('❌ 获取房间信息失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '获取房间信息失败',
    });
  }
};

/**
 * 获取景点统计
 * GET /api/collab/rooms/:roomId/stats
 */
export const getSpotStats = async (req: Request, res: Response) => {
  try {
    const roomId = req.params.roomId as string;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '未授权，请先登录',
      });
    }

    // 检查用户是否是Host
    const isHost = await collabService.isHost(roomId, userId);
    if (!isHost) {
      return res.status(403).json({
        success: false,
        error: '仅Host可查看景点统计',
      });
    }

    const stats = await collabService.getSpotStats(roomId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('❌ 获取景点统计失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '获取景点统计失败',
    });
  }
};

/**
 * 锁定房间
 * POST /api/collab/rooms/:roomId/lock
 */
export const lockRoom = async (req: Request, res: Response) => {
  try {
    const roomId = req.params.roomId as string;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '未授权，请先登录',
      });
    }

    // 检查用户是否是Host
    const isHost = await collabService.isHost(roomId, userId);
    if (!isHost) {
      return res.status(403).json({
        success: false,
        error: '仅Host可锁定房间',
      });
    }

    const room = await collabService.lockRoom(roomId);

    // 广播房间锁定事件
    broadcastToRoom(roomId, 'room:lock', {
      timestamp: new Date(),
    });

    res.json({
      success: true,
      data: room,
    });
  } catch (error: any) {
    console.error('❌ 锁定房间失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '锁定房间失败',
    });
  }
};

/**
 * 创建或更新草案
 * POST /api/collab/drafts
 */
export const upsertDraft = async (req: Request, res: Response) => {
  try {
    const { roomId, dayNumber, spotSequence, polylineData } = req.body;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '未授权，请先登录',
      });
    }

    if (!roomId || !dayNumber || !spotSequence || !polylineData) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数',
      });
    }

    const draft = await collabService.upsertDraft(
      roomId,
      userId,
      dayNumber,
      spotSequence,
      polylineData
    );

    res.json({
      success: true,
      data: draft,
    });
  } catch (error: any) {
    console.error('❌ 创建/更新草案失败:', error);
    
    // 如果是房间锁定错误，返回403
    if (error.message === '房间已锁定，无法修改草案') {
      return res.status(403).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || '创建/更新草案失败',
    });
  }
};

/**
 * 提交草案
 * POST /api/collab/drafts/:draftId/submit
 */
export const submitDraft = async (req: Request, res: Response) => {
  try {
    const draftId = req.params.draftId as string;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '未授权，请先登录',
      });
    }

    const draft = await collabService.submitDraft(draftId, userId);

    // 广播草案提交事件
    broadcastToRoom(draft.roomId, 'draft:submitted', {
      userId,
      dayNumber: draft.dayNumber,
      timestamp: new Date(),
    });

    res.json({
      success: true,
      data: draft,
    });
  } catch (error: any) {
    console.error('❌ 提交草案失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '提交草案失败',
    });
  }
};

/**
 * 获取用户的草案列表
 * GET /api/collab/rooms/:roomId/drafts
 */
export const getUserDrafts = async (req: Request, res: Response) => {
  try {
    const roomId = req.params.roomId as string;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '未授权，请先登录',
      });
    }

    const drafts = await collabService.getUserDrafts(roomId, userId);

    res.json({
      success: true,
      data: drafts,
    });
  } catch (error: any) {
    console.error('❌ 获取草案列表失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '获取草案列表失败',
    });
  }
};

/**
 * 发送消息
 * POST /api/collab/messages
 */
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { roomId, content } = req.body;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '未授权，请先登录',
      });
    }

    if (!roomId || !content) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数',
      });
    }

    const message = await collabService.sendMessage(roomId, userId, content);

    // 广播新消息事件
    broadcastToRoom(roomId, 'message:new', message);

    res.json({
      success: true,
      data: message,
    });
  } catch (error: any) {
    console.error('❌ 发送消息失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '发送消息失败',
    });
  }
};

/**
 * 获取房间消息列表
 * GET /api/collab/messages/:roomId
 */
export const getMessages = async (req: Request, res: Response) => {
  try {
    const roomId = req.params.roomId as string;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '未授权，请先登录',
      });
    }

    // 检查用户是否是房间成员
    const isMember = await collabService.isMember(roomId, userId);
    if (!isMember) {
      return res.status(403).json({
        success: false,
        error: '无权访问该房间消息',
      });
    }

    const messages = await collabService.getMessages(roomId);

    res.json({
      success: true,
      data: messages,
    });
  } catch (error: any) {
    console.error('❌ 获取消息列表失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '获取消息列表失败',
    });
  }
};
