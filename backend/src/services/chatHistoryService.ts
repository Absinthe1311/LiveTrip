// 描述：TempData接口新增tripId可选字段，用于行程确认流程中保存draft行程的引用。
// 对话历史服务 - 管理对话会话和消息
import { getPrismaClient } from '../lib/prisma';

const prisma = getPrismaClient();

//  P0优化: 会话状态类型
export enum SessionState {
  IDLE = 'idle', // 空闲状态
  WAITING_CONFIRMATION = 'waiting', // 等待确认
  COMPLETED = 'completed', // 已完成
}

//  P0优化: 临时数据类型
export enum TempDataType {
  TRIP_DRAFT = 'trip_draft', // 行程草稿
  BLOG_DRAFT = 'blog_draft', // 博客草稿
}

interface CreateSessionParams {
  userId?: string;
  mode: 'advisor' | 'agent';
}

interface CreateMessageParams {
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  toolCall?: string;
}

interface msgsParams {
  sessionId: string;
  limit?: number;
}

//  P0优化: 临时数据结构
interface TempData {
  type: TempDataType;
  tripId?: string;
  blogId?: string;
  data: any;
  createdAt: Date;
  expiresAt: Date;
}

class ChatHistoryService {
  /**
   * 创建新的对话会话
   */
  async newSession(params: CreateSessionParams) {
    try {
      const session = await prisma.chatSession.create({
        data: {
          userId: params.userId,
          mode: params.mode,
          state: SessionState.IDLE, //  P0优化: 初始状态为空闲
        },
      });

      return session;
    } catch (error) {
      throw error;
    }
  }

  /**
   *  P0优化: 更新会话状态
   */
  async updState(sessionId: string, state: SessionState) {
    try {
      const session = await prisma.chatSession.update({
        where: { id: sessionId },
        data: {
          state: state,
          updatedAt: new Date(),
        },
      });

      return session;
    } catch (error) {
      throw error;
    }
  }

  /**
   *  P0优化: 更新会话临时数据
   */
  async setTemp(sessionId: string, tempData: TempData) {
    try {
      const session = await prisma.chatSession.update({
        where: { id: sessionId },
        data: {
          tempData: JSON.stringify(tempData),
          state: SessionState.WAITING_CONFIRMATION, // 自动设置为等待确认状态
          updatedAt: new Date(),
        },
      });

      return session;
    } catch (error) {
      throw error;
    }
  }

  /**
   *  P0优化: 清除会话临时数据
   */
  async clearTemp(sessionId: string) {
    try {
      const session = await prisma.chatSession.update({
        where: { id: sessionId },
        data: {
          tempData: '',
          state: SessionState.IDLE, // 重置为空闲状态
          updatedAt: new Date(),
        },
      });

      return session;
    } catch (error) {
      throw error;
    }
  }

  /**
   *  P0优化: 获取会话信息
   */
  async getChat(sessionId: string) {
    try {
      const session = await prisma.chatSession.findUnique({
        where: { id: sessionId },
      });

      return session;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 获取或创建会话（用于 advisor 模式）
   */
  async advisorSession(userId?: string) {
    try {
      // 查找最近 10 分钟内的 advisor 模式会话
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

      let session = await prisma.chatSession.findFirst({
        where: {
          userId: userId || null,
          mode: 'advisor',
          createdAt: {
            gte: tenMinutesAgo,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // 如果没有找到，创建新会话
      if (!session) {
        session = await this.newSession({
          userId,
          mode: 'advisor',
        });
      } else {
        // 更新会话的最后活跃时间
        session = await prisma.chatSession.update({
          where: { id: session.id },
          data: { updatedAt: new Date() },
        });
      }

      return session;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 获取或创建会话（用于 agent 模式）
   */
  async agentSession(userId?: string) {
    try {
      // 查找最近 10 分钟内的 agent 模式会话
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

      let session = await prisma.chatSession.findFirst({
        where: {
          userId: userId || null,
          mode: 'agent',
          createdAt: {
            gte: tenMinutesAgo,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // 如果没有找到，创建新会话
      if (!session) {
        session = await this.newSession({
          userId,
          mode: 'agent',
        });
      } else {
        // 更新会话的最后活跃时间
        session = await prisma.chatSession.update({
          where: { id: session.id },
          data: { updatedAt: new Date() },
        });
      }

      return session;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 创建消息
   */
  async newMsg(params: CreateMessageParams) {
    try {
      const message = await prisma.chatMessage.create({
        data: {
          sessionId: params.sessionId,
          role: params.role,
          content: params.content,
          toolCall: params.toolCall || '',
        },
      });

      // 更新会话的最后活跃时间
      await prisma.chatSession.update({
        where: { id: params.sessionId },
        data: { updatedAt: new Date() },
      });

      return message;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 获取会话的消息历史（限制最近 N 条）
   */
  async fetchMsgs(params: msgsParams) {
    try {
      const messages = await prisma.chatMessage.findMany({
        where: {
          sessionId: params.sessionId,
        },
        orderBy: {
          createdAt: 'asc',
        },
        take: params.limit || 10, // 默认返回最近 10 条消息
      });

      return messages;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 获取用户的所有会话列表
   */
  async listChats(userId?: string, mode?: 'advisor' | 'agent') {
    try {
      const where: any = {};

      if (userId) {
        where.userId = userId;
      } else {
        where.userId = null;
      }

      if (mode) {
        where.mode = mode;
      }

      const sessions = await prisma.chatSession.findMany({
        where,
        orderBy: {
          updatedAt: 'desc',
        },
        take: 50, // 最多返回 50 个会话
      });

      return sessions;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 删除会话（及关联的所有消息）
   */
  async dropChat(sessionId: string) {
    try {
      await prisma.chatSession.delete({
        where: { id: sessionId },
      });

    } catch (error) {
      throw error;
    }
  }

  /**
   * 获取会话详情（包含消息）
   */
  async chatWithMsgs(sessionId: string) {
    try {
      const session = await prisma.chatSession.findUnique({
        where: { id: sessionId },
        include: {
          messages: {
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      });

      return session;
    } catch (error) {
      throw error;
    }
  }
}

// 导出单例
export const chatHistoryService = new ChatHistoryService();
