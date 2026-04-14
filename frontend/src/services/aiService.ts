// AI 服务 - 统一的 AI 对话服务
import { getUserId } from '../utils/auth';

export type ChatMode = 'advisor' | 'agent';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
  previewData?: any;
  needsConfirmation?: boolean;
  sessionId?: string;
}

export interface ChatSession {
  id: string;
  userId?: string;
  mode: ChatMode;
  createdAt: string;
  updatedAt: string;
}

export interface AIResponse {
  success: boolean;
  data?: {
    answer: string;
    message?: string;
    toolCalls?: Array<{
      name: string;
      result: any;
    }>;
  };
  error?: string;
  needsConfirmation?: boolean;
  needsMoreInfo?: boolean;
  previewData?: any;
  sessionId?: string;
}

/**
 * AI 服务类
 */
class AIService {
  private baseUrl = 'http://localhost:3003/api';

  /**
   * 发送消息（问答助手模式）
   */
  async sendAdvisorMessage(question: string, context?: any): Promise<AIResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const userId = getUserId();
    if (userId) {
      headers['x-user-id'] = userId;
    }

    const response = await fetch(`${this.baseUrl}/advisor/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        question,
        planContext: context,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * 发送消息（智能助手模式）
   */
  async sendAgentMessage(question: string): Promise<AIResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const userId = getUserId();
    if (userId) {
      headers['x-user-id'] = userId;
    }

    const response = await fetch(`${this.baseUrl}/agent/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        question,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * 获取用户会话列表
   */
  async getUserSessions(mode?: ChatMode): Promise<ChatSession[]> {
    const headers: Record<string, string> = {};
    const userId = getUserId();
    if (userId) {
      headers['x-user-id'] = userId;
    }

    const response = await fetch(
      `${this.baseUrl}/advisor/sessions${mode ? `?mode=${mode}` : ''}`,
      {
        method: 'GET',
        headers,
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
  }

  /**
   * 获取会话的消息历史
   */
  async getSessionMessages(sessionId: string, limit: number = 10): Promise<Message[]> {
    const response = await fetch(
      `${this.baseUrl}/advisor/sessions/${sessionId}/messages?limit=${limit}`,
      {
        method: 'GET',
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
  }

  /**
   * 删除会话
   */
  async deleteSession(sessionId: string): Promise<void> {
    const headers: Record<string, string> = {};
    const userId = getUserId();
    if (userId) {
      headers['x-user-id'] = userId;
    }

    const response = await fetch(`${this.baseUrl}/advisor/sessions/${sessionId}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }
}

// 导出单例
export const aiService = new AIService();
