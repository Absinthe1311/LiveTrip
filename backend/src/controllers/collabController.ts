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
 * 获取所有成员的草案
 * GET /api/collab/rooms/:roomId/drafts/all
 */
export const getAllDrafts = async (req: Request, res: Response) => {
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
        error: '您不是该房间的成员',
      });
    }

    // 获取房间信息
    const room = await collabService.getRoomInfo(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        error: '房间不存在',
      });
    }

    // 获取所有成员的草案
    const allDrafts = await Promise.all(
      room.members.map(async (member) => {
        const drafts = await collabService.getUserDrafts(roomId, member.userId);
        return {
          userId: member.userId,
          username: member.user.username,
          drafts: drafts,
        };
      })
    );

    res.json({
      success: true,
      data: allDrafts,
    });
  } catch (error: any) {
    console.error('❌ 获取所有草案失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '获取所有草案失败',
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

/**
 * 保存最终协同行程
 * POST /api/collab/finalize
 */
export const saveFinalTrip = async (req: Request, res: Response) => {
  try {
    const { roomId, finalRoute } = req.body;
    const userId = (req as any).user?.userId;

    console.log('📝 保存最终行程请求:', { roomId, finalRoute, userId });

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '未授权，请先登录',
      });
    }

    if (!roomId || !finalRoute || !Array.isArray(finalRoute)) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数或参数格式错误',
      });
    }

    // 检查用户是否是Host
    const isHost = await collabService.isHost(roomId, userId);
    if (!isHost) {
      return res.status(403).json({
        success: false,
        error: '仅Host可保存最终行程',
      });
    }

    // 获取房间信息
    const room = await collabService.getRoomInfo(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        error: '房间不存在',
      });
    }

    // 更新Trip的行程数据
    const { getPrismaClient } = require('../lib/prisma');
    const prisma = getPrismaClient();

    // finalRoute是景点数组，需要转换为行程数据格式
    // 假设finalRoute就是当前天的景点列表
    const itineraryData = [{
      day: 1, // 当前只保存第1天
      date: new Date(room.trip.startDate).toISOString().split('T')[0],
      attractions: finalRoute.map((spot: any) => ({
        id: spot.id,
        name: spot.name,
        location: spot.location,
        arrivalTime: spot.arrivalTime || '09:00',
        duration: spot.duration || 120,
        departureTime: spot.departureTime || '11:00',
      })),
    }];

    console.log('📅 行程数据:', itineraryData);

    // 更新Trip
    const updatedTrip = await prisma.trip.update({
      where: { id: room.tripId },
      data: {
        source: 'collaborative',
        status: 'finalized',
        description: `协同规划完成 - ${room.members.length}人参与`,
      },
    });

    console.log('✅ Trip已更新:', updatedTrip.id);

    // 更新或创建Day和ItineraryItem
    for (const dayData of itineraryData) {
      const dayDate = new Date(dayData.date);
      
      // 查找或创建Day
      let day = await prisma.day.findFirst({
        where: {
          tripId: room.tripId,
          dayNumber: dayData.day,
        },
      });

      if (!day) {
        day = await prisma.day.create({
          data: {
            tripId: room.tripId,
            dayNumber: dayData.day,
            date: dayDate,
          },
        });
        console.log('✅ Day已创建:', day.id);
      } else {
        console.log('✅ Day已存在:', day.id);
      }

      // 删除旧的ItineraryItem
      await prisma.itineraryItem.deleteMany({
        where: { dayId: day.id },
      });

      // 创建新的ItineraryItem
      for (let i = 0; i < dayData.attractions.length; i++) {
        const attraction = dayData.attractions[i];
        
        // 解析location
        let lng = 0;
        let lat = 0;
        if (attraction.location && typeof attraction.location === 'string') {
          const parts = attraction.location.split(',');
          if (parts.length === 2) {
            lng = parseFloat(parts[0]) || 0;
            lat = parseFloat(parts[1]) || 0;
          }
        }

        // 解析时间
        const startTime = new Date(`${dayData.date}T${attraction.arrivalTime}:00`);
        const endTime = new Date(`${dayData.date}T${attraction.departureTime}:00`);
        
        await prisma.itineraryItem.create({
          data: {
            dayId: day.id,
            name: attraction.name,
            type: 'attraction',
            spotId: attraction.id,
            startTime,
            endTime,
            latitude: lat,
            longitude: lng,
          },
        });
      }
      
    console.log(`✅ Day ${dayData.day} 的 ${dayData.attractions.length} 个景点已保存`);
    }

    // 为所有成员创建行程副本
    console.log('👥 开始为所有成员创建行程副本...');
    
    for (const member of room.members) {
      // 跳过房主（房主的行程已经更新）
      if (member.userId === room.hostId) {
        console.log(`⏭️ 跳过房主 ${member.user.username}`);
        continue;
      }
      
      // 为成员创建新的Trip
      const memberTrip = await prisma.trip.create({
        data: {
          userId: member.userId,
          title: `${room.trip.title} (协同)`,
          description: `协同规划完成 - ${room.members.length}人参与`,
          destination: room.trip.destination,
          startDate: room.trip.startDate,
          endDate: room.trip.endDate,
          totalBudget: room.trip.totalBudget,
          source: 'collaborative',
          status: 'finalized',
          aiGenerated: false,
        },
      });
      
      console.log(`✅ 为成员 ${member.user.username} 创建Trip: ${memberTrip.id}`);
      
      // 为成员创建Day和ItineraryItem
      for (const dayData of itineraryData) {
        const dayDate = new Date(dayData.date);
        
        const memberDay = await prisma.day.create({
          data: {
            tripId: memberTrip.id,
            dayNumber: dayData.day,
            date: dayDate,
          },
        });
        
        // 创建ItineraryItem
        for (let i = 0; i < dayData.attractions.length; i++) {
          const attraction = dayData.attractions[i];
          
          // 解析location
          let lng = 0;
          let lat = 0;
          if (attraction.location && typeof attraction.location === 'string') {
            const parts = attraction.location.split(',');
            if (parts.length === 2) {
              lng = parseFloat(parts[0]) || 0;
              lat = parseFloat(parts[1]) || 0;
            }
          }
          
          // 解析时间
          const startTime = new Date(`${dayData.date}T${attraction.arrivalTime}:00`);
          const endTime = new Date(`${dayData.date}T${attraction.departureTime}:00`);
          
          await prisma.itineraryItem.create({
            data: {
              dayId: memberDay.id,
              name: attraction.name,
              type: 'attraction',
              spotId: attraction.id,
              startTime,
              endTime,
              latitude: lat,
              longitude: lng,
            },
          });
        }
      }
      
      console.log(`✅ 成员 ${member.user.username} 的行程已保存`);
    }
    
    console.log(`✅ 所有 ${room.members.length} 个成员的行程已保存`);

    // 锁定房间
    await collabService.lockRoom(roomId);

    // 广播房间锁定事件
    broadcastToRoom(roomId, 'room:lock', {
      timestamp: new Date(),
    });

    res.json({
      success: true,
      data: {
        tripId: room.tripId,
        message: '协同行程已保存',
      },
    });
  } catch (error: any) {
    console.error('❌ 保存最终行程失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '保存最终行程失败',
    });
  }
};
