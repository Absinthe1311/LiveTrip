// 对话历史服务 - 管理对话会话和消息
import { getPrismaClient } from '../lib/prisma';

const prisma = getPrismaClient();

// ✅ P0优化: 会话状态类型
export enum SessionState {
  IDLE = 'idle',                    // 空闲状态
  WAITING_CONFIRMATION = 'waiting', // 等待确认
  COMPLETED = 'completed',          // 已完成
}

// ✅ P0优化: 临时数据类型
export enum TempDataType {
  TRIP_DRAFT = 'trip_draft',        // 行程草稿
  BLOG_DRAFT = 'blog_draft',        // 博客草稿
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

interface GetMessagesParams {
  sessionId: string;
  limit?: number;
}

// ✅ P0优化: 临时数据结构
interface TempData {
  type: TempDataType;
  data: any;
  createdAt: Date;
  expiresAt: Date;
}

class ChatHistoryService {
  /**
   * 创建新的对话会话
   */
  async createSession(params: CreateSessionParams) {
    try {
      const session = await prisma.chatSession.create({
        data: {
          userId: params.userId,
          mode: params.mode,
          state: SessionState.IDLE, // ✅ P0优化: 初始状态为空闲
        },
      });

      console.log(`✅ 创建对话会话成功: ${session.id}`);
      return session;
    } catch (error) {
      console.error('❌ 创建对话会话失败:', error);
      throw error;
    }
  }

  /**
   * ✅ P0优化: 更新会话状态
   */
  async updateSessionState(sessionId: string, state: SessionState) {
    try {
      const session = await prisma.chatSession.update({
        where: { id: sessionId },
        data: {
          state: state,
          updatedAt: new Date(),
        },
      });

      console.log(`✅ 更新会话状态: ${sessionId} -> ${state}`);
      return session;
    } catch (error) {
      console.error('❌ 更新会话状态失败:', error);
      throw error;
    }
  }

  /**
   * ✅ P0优化: 更新会话临时数据
   */
  async updateSessionTempData(sessionId: string, tempData: TempData) {
    try {
      const session = await prisma.chatSession.update({
        where: { id: sessionId },
        data: {
          tempData: JSON.stringify(tempData),
          state: SessionState.WAITING_CONFIRMATION, // 自动设置为等待确认状态
          updatedAt: new Date(),
        },
      });

      console.log(`✅ 更新会话临时数据: ${sessionId}`);
      return session;
    } catch (error) {
      console.error('❌ 更新会话临时数据失败:', error);
      throw error;
    }
  }

  /**
   * ✅ P0优化: 清除会话临时数据
   */
  async clearSessionTempData(sessionId: string) {
    try {
      const session = await prisma.chatSession.update({
        where: { id: sessionId },
        data: {
          tempData: '',
          state: SessionState.IDLE, // 重置为空闲状态
          updatedAt: new Date(),
        },
      });

      console.log(`✅ 清除会话临时数据: ${sessionId}`);
      return session;
    } catch (error) {
      console.error('❌ 清除会话临时数据失败:', error);
      throw error;
    }
  }

  /**
   * ✅ P0优化: 获取会话信息
   */
  async getSession(sessionId: string) {
    try {
      const session = await prisma.chatSession.findUnique({
        where: { id: sessionId },
      });

      return session;
    } catch (error) {
      console.error('❌ 获取会话信息失败:', error);
      throw error;
    }
  }

  /**
   * 获取或创建会话（用于 advisor 模式）
   */
  async getOrCreateAdvisorSession(userId?: string) {
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
        session = await this.createSession({
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
      console.error('❌ 获取或创建会话失败:', error);
      throw error;
    }
  }

  /**
   * 获取或创建会话（用于 agent 模式）
   */
  async getOrCreateAgentSession(userId?: string) {
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
        session = await this.createSession({
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
      console.error('❌ 获取或创建会话失败:', error);
      throw error;
    }
  }

  /**
   * 创建消息
   */
  async createMessage(params: CreateMessageParams) {
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
      console.error('❌ 创建消息失败:', error);
      throw error;
    }
  }

  /**
   * 获取会话的消息历史（限制最近 N 条）
   */
  async getMessages(params: GetMessagesParams) {
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
      console.error('❌ 获取消息历史失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户的所有会话列表
   */
  async getUserSessions(userId?: string, mode?: 'advisor' | 'agent') {
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
      console.error('❌ 获取用户会话列表失败:', error);
      throw error;
    }
  }

  /**
   * 删除会话（及关联的所有消息）
   */
  async deleteSession(sessionId: string) {
    try {
      await prisma.chatSession.delete({
        where: { id: sessionId },
      });

      console.log(`✅ 删除会话成功: ${sessionId}`);
    } catch (error) {
      console.error('❌ 删除会话失败:', error);
      throw error;
    }
  }

  /**
   * 获取会话详情（包含消息）
   */
  async getSessionWithMessages(sessionId: string) {
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
      console.error('❌ 获取会话详情失败:', error);
      throw error;
    }
  }
}

// 导出单例
export const chatHistoryService = new ChatHistoryService();
