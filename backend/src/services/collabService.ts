// 协同规划服务 - 处理协同房间、成员、草案和消息的业务逻辑
import { getPrismaClient } from '../lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { addHours } from 'date-fns';

const prisma = getPrismaClient();

/**
 * 协同房间服务类
 */
export class CollabService {
  /**
   * 创建协同房间
   * @param tripId 行程ID
   * @param hostId Host用户ID
   * @returns 房间信息和邀请链接
   */
  async createRoom(tripId: string, hostId: string) {
    // 检查行程是否存在
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
    });

    if (!trip) {
      throw new Error('行程不存在');
    }

    // 检查该行程是否已有协同房间
    const existingRoom = await prisma.collabRoom.findUnique({
      where: { tripId },
    });

    if (existingRoom) {
      throw new Error('该行程已存在协同房间');
    }

    // 生成邀请token和过期时间
    const inviteToken = uuidv4();
    const inviteExpiresAt = addHours(new Date(), 72); // 72小时后过期

    // 创建协同房间
    const room = await prisma.collabRoom.create({
      data: {
        tripId,
        hostId,
        inviteToken,
        inviteExpiresAt,
        phase: 'EDITING',
      },
      include: {
        trip: true,
        host: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    // 自动将Host添加为成员
    await prisma.tripMember.create({
      data: {
        roomId: room.id,
        userId: hostId,
        role: 'HOST',
        assignedDays: '[]',
      },
    });

    // 生成邀请链接
    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/collab/join?token=${inviteToken}`;

    return {
      room,
      inviteLink,
    };
  }

  /**
   * 通过邀请token加入协同房间
   * @param token 邀请token
   * @param userId 用户ID
   * @returns 房间信息
   */
  async joinRoom(token: string, userId: string) {
    // 查找房间
    const room = await prisma.collabRoom.findUnique({
      where: { inviteToken: token },
      include: {
        trip: true,
        host: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    if (!room) {
      throw new Error('邀请链接无效');
    }

    // 检查是否过期
    if (new Date() > room.inviteExpiresAt) {
      throw new Error('邀请链接已过期');
    }

    // 检查用户是否已是成员
    const existingMember = await prisma.tripMember.findUnique({
      where: {
        roomId_userId: {
          roomId: room.id,
          userId,
        },
      },
    });

    if (existingMember) {
      // 已是成员，直接返回房间信息
      return room;
    }

    // 添加为协作者
    await prisma.tripMember.create({
      data: {
        roomId: room.id,
        userId,
        role: 'COLLABORATOR',
        assignedDays: '[]',
      },
    });

    return room;
  }

  /**
   * 获取房间信息
   * @param roomId 房间ID
   * @returns 房间信息、成员列表、当前phase
   */
  async getRoomInfo(roomId: string) {
    const room = await prisma.collabRoom.findUnique({
      where: { id: roomId },
      include: {
        trip: true,
        host: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!room) {
      throw new Error('房间不存在');
    }

    return room;
  }

  /**
   * 获取景点统计数据（仅Host可访问）
   * @param roomId 房间ID
   * @returns 景点统计列表
   */
  async getSpotStats(roomId: string) {
    // 获取所有已提交的草案
    const submittedDrafts = await prisma.draftRoute.findMany({
      where: {
        roomId,
        isSubmitted: true,
      },
      select: {
        spotSequence: true,
      },
    });

    // 统计每个景点的出现次数
    const spotCountMap = new Map<string, number>();

    for (const draft of submittedDrafts) {
      const spotIds: string[] = JSON.parse(draft.spotSequence);
      for (const spotId of spotIds) {
        const count = spotCountMap.get(spotId) || 0;
        spotCountMap.set(spotId, count + 1);
      }
    }

    // 查询景点详情
    const spotIds = Array.from(spotCountMap.keys());
    const spots = await prisma.spot.findMany({
      where: {
        id: { in: spotIds },
      },
      select: {
        id: true,
        name: true,
        location: true,
        category: true,
      },
    });

    // 组合统计数据
    const stats = spots.map((spot) => ({
      ...spot,
      count: spotCountMap.get(spot.id) || 0,
    }));

    // 按出现次数降序排列
    stats.sort((a, b) => b.count - a.count);

    return stats;
  }

  /**
   * 锁定房间（仅Host可操作）
   * @param roomId 房间ID
   * @returns 更新后的房间信息
   */
  async lockRoom(roomId: string) {
    const room = await prisma.collabRoom.update({
      where: { id: roomId },
      data: {
        phase: 'LOCKED',
      },
    });

    return room;
  }

  /**
   * 创建或更新草案（upsert）
   * @param roomId 房间ID
   * @param userId 用户ID
   * @param dayNumber 天数
   * @param spotSequence 景点序列
   * @param polylineData 路线数据
   * @returns 草案信息
   */
  async upsertDraft(
    roomId: string,
    userId: string,
    dayNumber: number,
    spotSequence: string[],
    polylineData: any
  ) {
    // 检查房间是否已锁定
    const room = await prisma.collabRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new Error('房间不存在');
    }

    if (room.phase === 'LOCKED') {
      throw new Error('房间已锁定，无法修改草案');
    }

    // Upsert草案
    const draft = await prisma.draftRoute.upsert({
      where: {
        roomId_userId_dayNumber: {
          roomId,
          userId,
          dayNumber,
        },
      },
      update: {
        spotSequence: JSON.stringify(spotSequence),
        polylineData: JSON.stringify(polylineData),
        version: { increment: 1 },
      },
      create: {
        roomId,
        userId,
        dayNumber,
        spotSequence: JSON.stringify(spotSequence),
        polylineData: JSON.stringify(polylineData),
        isSubmitted: false,
        version: 1,
      },
    });

    return draft;
  }

  /**
   * 提交草案
   * @param draftId 草案ID
   * @param userId 用户ID
   * @returns 更新后的草案信息
   */
  async submitDraft(draftId: string, userId: string) {
    // 检查草案是否存在且属于该用户
    const draft = await prisma.draftRoute.findFirst({
      where: {
        id: draftId,
        userId,
      },
    });

    if (!draft) {
      throw new Error('草案不存在或无权操作');
    }

    if (draft.isSubmitted) {
      throw new Error('草案已提交，无法重复提交');
    }

    // 更新为已提交
    const updatedDraft = await prisma.draftRoute.update({
      where: { id: draftId },
      data: {
        isSubmitted: true,
      },
    });

    return updatedDraft;
  }

  /**
   * 获取用户在房间中的所有草案
   * @param roomId 房间ID
   * @param userId 用户ID
   * @returns 草案列表
   */
  async getUserDrafts(roomId: string, userId: string) {
    const drafts = await prisma.draftRoute.findMany({
      where: {
        roomId,
        userId,
      },
      orderBy: {
        dayNumber: 'asc',
      },
    });

    return drafts;
  }

  /**
   * 发送消息
   * @param roomId 房间ID
   * @param userId 用户ID
   * @param content 消息内容
   * @returns 消息信息
   */
  async sendMessage(roomId: string, userId: string, content: string) {
    const message = await prisma.collabMessage.create({
      data: {
        roomId,
        userId,
        content,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    return message;
  }

  /**
   * 获取房间的所有消息
   * @param roomId 房间ID
   * @returns 消息列表
   */
  async getMessages(roomId: string) {
    const messages = await prisma.collabMessage.findMany({
      where: {
        roomId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return messages;
  }

  /**
   * 检查用户是否是房间的Host
   * @param roomId 房间ID
   * @param userId 用户ID
   * @returns 是否是Host
   */
  async isHost(roomId: string, userId: string): Promise<boolean> {
    const room = await prisma.collabRoom.findUnique({
      where: { id: roomId },
    });

    return room?.hostId === userId;
  }

  /**
   * 检查用户是否是房间成员
   * @param roomId 房间ID
   * @param userId 用户ID
   * @returns 是否是成员
   */
  async isMember(roomId: string, userId: string): Promise<boolean> {
    const member = await prisma.tripMember.findUnique({
      where: {
        roomId_userId: {
          roomId,
          userId,
        },
      },
    });

    return !!member;
  }
}

export const collabService = new CollabService();
