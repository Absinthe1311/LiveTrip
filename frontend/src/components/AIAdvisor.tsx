// AI 咨询组件 - 支持问答助手和智能助手两种模式
import { useState } from 'react';
import { Sparkles, Send, ChevronDown, ChevronUp, MessageCircle, Bot } from 'lucide-react';
import { aiService, ChatMode } from '../services/aiService';

interface AIAdvisorProps {
  destination?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  defaultMode?: ChatMode;
}

const ADVISOR_QUICK_QUESTIONS = [
  '这个目的地有什么特色？',
  '最佳旅行时间是什么时候？',
  '有什么必去的景点？',
  '当地美食推荐',
  '需要注意什么？',
];

const AGENT_QUICK_QUESTIONS = [
  '帮我创建一个行程',
  '查看我的行程列表',
  '生成旅行博客',
];

export default function AIAdvisor({
  destination,
  startDate,
  endDate,
  budget,
  defaultMode = 'advisor',
}: AIAdvisorProps) {
  const [expanded, setExpanded] = useState(false);
  const [mode, setMode] = useState<ChatMode>(defaultMode);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: destination 
        ? `您好！我是您的 AI 旅行顾问。关于 ${destination} 的旅行，有什么我可以帮助您的吗？`
        : '您好！我是您的 AI 旅行顾问。请先选择目的地，我将为您提供专业的旅行建议。',
    },
  ]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!inputValue.trim() || loading) return;

    const userMessage = { role: 'user' as const, content: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      let data;
      if (mode === 'advisor') {
        data = await aiService.sendAdvisorMessage(inputValue, {
          destination,
          startDate,
          endDate,
          budget,
        });
      } else {
        data = await aiService.sendAgentMessage(inputValue);
      }

      if (data.success && data.data?.answer) {
        const aiResponse = {
          role: 'assistant' as const,
          content: data.data.answer,
        };
        setMessages(prev => [...prev, aiResponse]);
      } else {
        throw new Error(data.error || '获取回答失败');
      }
    } catch (error: any) {
      console.error('❌ AI请求失败:', error);
      const errorMessage = {
        role: 'assistant' as const,
        content: `抱歉，AI暂时无法使用。错误信息：${error.message || '请稍后再试'}`,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInputValue(question);
  };

  const handleModeChange = (newMode: ChatMode) => {
    setMode(newMode);
    // 切换模式时重置消息
    const welcomeMessage = newMode === 'advisor'
      ? destination 
        ? `您好！我是您的 AI 旅行顾问。关于 ${destination} 的旅行，有什么我可以帮助您的吗？`
        : '您好！我是您的 AI 旅行顾问。请先选择目的地，我将为您提供专业的旅行建议。'
      : '您好！我是您的智能旅行助手。我可以帮您创建行程、查看行程列表、生成旅行博客。';
    
    setMessages([
      {
        role: 'assistant',
        content: welcomeMessage,
      },
    ]);
  };

  const getQuickQuestions = () => {
    return mode === 'advisor' ? ADVISOR_QUICK_QUESTIONS : AGENT_QUICK_QUESTIONS;
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            {mode === 'advisor' ? (
              <MessageCircle className="h-5 w-5 text-primary" />
            ) : (
              <Bot className="h-5 w-5 text-primary" />
            )}
          </div>
          <div className="text-left">
            <h4 className="text-[15px] font-semibold text-foreground">
              {mode === 'advisor' ? 'AI 旅行顾问' : '智能旅行助手'}
            </h4>
            <p className="text-[12px] text-muted-foreground">
              {mode === 'advisor' ? '获取专业的旅行建议' : '创建行程、生成博客'}
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {/* Content */}
      {expanded && (
        <div className="border-t border-border">
          {/* Mode Switcher */}
          <div className="p-3 border-b border-border">
            <div className="flex gap-2">
              <button
                onClick={() => handleModeChange('advisor')}
                className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  mode === 'advisor'
                    ? 'bg-livetrip-primary text-white'
                    : 'bg-gray-100 text-foreground hover:bg-gray-200'
                }`}
              >
                <MessageCircle className="w-3 h-3 inline mr-1" />
                问答助手
              </button>
              <button
                onClick={() => handleModeChange('agent')}
                className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  mode === 'agent'
                    ? 'bg-livetrip-primary text-white'
                    : 'bg-gray-100 text-foreground hover:bg-gray-200'
                }`}
              >
                <Bot className="w-3 h-3 inline mr-1" />
                智能助手
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="h-[200px] overflow-y-auto p-4 space-y-3">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-lg text-[13px] ${
                    msg.role === 'user'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-foreground'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Questions */}
          <div className="px-4 pb-3">
            <div className="flex flex-wrap gap-2">
              {getQuickQuestions().map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickQuestion(q)}
                  className="px-3 py-1.5 rounded-full bg-gray-100 text-[12px] text-muted-foreground hover:bg-gray-200 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder={mode === 'advisor' ? "输入您的问题..." : "告诉我您的需求..."}
                disabled={loading}
                className="flex-1 h-10 px-3 rounded-lg border border-border bg-background text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || loading}
                className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
