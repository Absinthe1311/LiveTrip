// AI 功能页面 - 毛玻璃风格版本
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, MessageCircle, Bot, Send, Trash2, Plus } from 'lucide-react';
import GlassLayout from '../components/GlassLayout';
import { GlassCard } from '../components/home';
import { aiService, ChatMode } from '../services/aiService';
import { message } from 'antd';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AIFeaturesGlass() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<ChatMode>('agent');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '您好！我是您的 AI 旅行助手。我可以帮您规划行程、推荐景点、解答旅行问题。请问有什么可以帮助您的吗？',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!inputValue.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const response = await aiService.sendAgentMessage(inputValue);

      if (response.success && response.data?.answer) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.data.answer,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        throw new Error(response.error || '获取回答失败');
      }
    } catch (error: any) {
      console.error('AI 请求失败:', error);
      message.error('AI 请求失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: '对话已清空。请问有什么可以帮助您的吗？',
        timestamp: new Date(),
      },
    ]);
  };

  const quickQuestions = [
    '帮我规划一个北京三日游',
    '推荐一些适合家庭出游的景点',
    '如何制定旅行预算？',
    '旅行中需要注意什么？',
  ];

  return (
    <GlassLayout showSearch={false}>
      <div className="space-y-6 h-full">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-livetrip-primary/20">
              <Sparkles className="h-8 w-8 text-livetrip-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">AI 智能助手</h1>
              <p className="text-white/60">您的专属旅行规划顾问</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMode('advisor')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                mode === 'advisor'
                  ? 'bg-livetrip-primary text-white'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              <MessageCircle className="h-4 w-4 inline mr-2" />
              问答助手
            </button>
            <button
              onClick={() => setMode('agent')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                mode === 'agent'
                  ? 'bg-livetrip-primary text-white'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              <Bot className="h-4 w-4 inline mr-2" />
              智能助手
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6 h-[calc(100vh-200px)]">
          {/* 左侧：快捷问题 */}
          <div className="col-span-1">
            <GlassCard className="p-6 h-full">
              <h3 className="text-lg font-semibold text-white mb-4">快捷问题</h3>
              <div className="space-y-3">
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => setInputValue(question)}
                    className="w-full text-left px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white/80 text-sm hover:bg-white/10 hover:border-white/20 transition-all"
                  >
                    {question}
                  </button>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-white/10">
                <button
                  onClick={() => navigate('/plan')}
                  className="w-full px-4 py-3 rounded-lg bg-livetrip-primary text-white font-medium hover:bg-livetrip-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  创建行程
                </button>
              </div>
            </GlassCard>
          </div>

          {/* 右侧：对话区域 */}
          <div className="col-span-3 flex flex-col">
            <GlassCard className="flex-1 p-6 flex flex-col">
              {/* 对话消息 */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                        msg.role === 'user'
                          ? 'bg-livetrip-primary text-white'
                          : 'bg-white/10 text-white border border-white/20'
                      }`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="flex items-center gap-2 mb-2">
                          <Bot className="h-4 w-4 text-livetrip-primary" />
                          <span className="text-xs text-white/60">AI 助手</span>
                        </div>
                      )}
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                      <p className="text-xs text-white/40 mt-2">
                        {msg.timestamp.toLocaleTimeString('zh-CN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white/10 rounded-2xl px-4 py-3 border border-white/20">
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4 text-livetrip-primary" />
                        <div className="flex gap-1">
                          <div className="w-2 h-2 rounded-full bg-white/60 animate-bounce" />
                          <div className="w-2 h-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 输入区域 */}
              <div className="flex gap-3">
                <button
                  onClick={handleClearChat}
                  className="p-3 rounded-lg bg-white/10 border border-white/20 text-white/60 hover:bg-white/20 transition-colors"
                  title="清空对话"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="输入您的问题..."
                    className="w-full h-12 pl-4 pr-12 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 outline-none focus:ring-2 focus:ring-white/30 transition-all"
                  />
                  <button
                    onClick={handleSend}
                    disabled={loading || !inputValue.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-livetrip-primary text-white hover:bg-livetrip-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </GlassLayout>
  );
}
