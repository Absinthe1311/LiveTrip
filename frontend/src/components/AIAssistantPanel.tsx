// AI 助手面板 - 完整版（支持历史记录、模式切换、用例参考）
import { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  MessageCircle,
  History,
  Lightbulb,
  Trash2,
  ChevronDown,
  X
} from 'lucide-react';
import { aiService, ChatMode } from '../services/aiService';

interface AIAssistantPanelProps {
  destination?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  defaultMode?: ChatMode;
  onClose?: () => void;
}

// 快捷用例
const QUICK_EXAMPLES = {
  advisor: [
    '这个目的地有什么特色？',
    '最佳旅行时间是什么时候？',
    '有什么必去的景点？',
    '当地美食推荐',
    '需要注意什么？',
    '推荐一些特色体验',
  ],
  agent: [
    '我想去北京玩三天',
    '帮我规划一个上海两日游',
    '查看我的行程',
    '为上次旅行写一篇游记',
    '推荐一些适合情侣的景点',
    '预算5000元去杭州怎么玩？',
  ],
};

// 模式配置
const MODE_CONFIG = {
  advisor: {
    name: '问答助手',
    icon: MessageCircle,
    description: '回答旅行相关问题',
    color: 'from-[#145F39] to-[#145F39]/80',
    bgColor: 'bg-[#145F39]/10',
    borderColor: 'border-[#145F39]/30',
  },
  agent: {
    name: '智能助手',
    icon: Sparkles,
    description: '创建行程、管理旅行',
    color: 'from-[#AE1C31] to-[#AE1C31]/80',
    bgColor: 'bg-[#AE1C31]/10',
    borderColor: 'border-[#AE1C31]/30',
  },
};

export default function AIAssistantPanel({
  destination,
  startDate,
  endDate,
  budget,
  defaultMode = 'agent',
  onClose,
}: AIAssistantPanelProps) {
  const [mode, setMode] = useState<ChatMode>(defaultMode);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Array<{ 
    role: 'user' | 'assistant'; 
    content: string;
    timestamp?: Date;
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showExamples, setShowExamples] = useState(true);
  const [showModeSelector, setShowModeSelector] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 初始化欢迎消息
  useEffect(() => {
    const welcomeMessage = mode === 'agent'
      ? '您好！我是您的智能旅行助手。我可以帮您创建行程、查看行程、生成游记等。有什么可以帮您的吗？'
      : `您好！我是您的旅行问答助手。${destination ? `关于 ${destination} 的旅行` : ''}，有什么我可以帮助您的吗？`;
    
    setMessages([{
      role: 'assistant',
      content: welcomeMessage,
      timestamp: new Date(),
    }]);
  }, [mode, destination]);

  // 发送消息
  const handleSend = async () => {
    if (!inputValue.trim() || loading) return;

    const userMessage = { 
      role: 'user' as const, 
      content: inputValue,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);
    setShowExamples(false);

    try {
      let data;
      if (mode === 'agent') {
        data = await aiService.sendAgentMessage(inputValue);
      } else {
        data = await aiService.sendAdvisorMessage(inputValue, {
          destination,
          startDate,
          endDate,
          budget,
        });
      }

      if (data.success && data.data?.answer) {
        const aiResponse = {
          role: 'assistant' as const,
          content: data.data.answer,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiResponse]);
      } else {
        throw new Error(data.error || '获取回答失败');
      }
    } catch (error: any) {
      console.error('AI请求失败:', error);
      const errorMessage = {
        role: 'assistant' as const,
        content: `抱歉，遇到了一些问题：${error.message || '请稍后再试'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  // 清空对话
  const handleClearChat = () => {
    const welcomeMessage = mode === 'agent'
      ? '对话已清空。有什么可以帮您的吗？'
      : '对话已清空。请继续提问。';
    
    setMessages([{
      role: 'assistant',
      content: welcomeMessage,
      timestamp: new Date(),
    }]);
    setShowExamples(true);
  };

  // 点击用例
  const handleExampleClick = (example: string) => {
    setInputValue(example);
    inputRef.current?.focus();
  };

  const currentModeConfig = MODE_CONFIG[mode];
  const ModeIcon = currentModeConfig.icon;

  return (
    <div className="flex flex-col h-full bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
      {/* 头部 */}
      <div className="flex-shrink-0 p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          {/* 模式选择器 */}
          <div className="relative">
            <button
              onClick={() => setShowModeSelector(!showModeSelector)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl ${currentModeConfig.bgColor} border ${currentModeConfig.borderColor} hover:shadow-lg transition-all duration-300`}
            >
              <ModeIcon className="w-5 h-5 text-white" />
              <span className="text-sm font-medium text-white">{currentModeConfig.name}</span>
              <ChevronDown className={`w-4 h-4 text-white/60 transition-transform ${showModeSelector ? 'rotate-180' : ''}`} />
            </button>
            
            {/* 模式下拉菜单 */}
            {showModeSelector && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 shadow-xl overflow-hidden z-10">
                {(Object.keys(MODE_CONFIG) as ChatMode[]).map((modeKey) => {
                  const config = MODE_CONFIG[modeKey];
                  const Icon = config.icon;
                  const isActive = mode === modeKey;
                  
                  return (
                    <button
                      key={modeKey}
                      onClick={() => {
                        setMode(modeKey);
                        setShowModeSelector(false);
                      }}
                      className={`w-full flex items-center gap-3 p-3 transition-all duration-200 ${
                        isActive 
                          ? `${config.bgColor} border-l-2 ${config.borderColor.replace('/30', '')}` 
                          : 'hover:bg-white/5'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white/60'}`} />
                      <div className="text-left">
                        <div className={`text-sm font-medium ${isActive ? 'text-white' : 'text-white/80'}`}>
                          {config.name}
                        </div>
                        <div className="text-xs text-white/50">{config.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`p-2 rounded-lg transition-all duration-200 ${
                showHistory 
                  ? 'bg-white/20 text-white' 
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
              title="历史记录"
            >
              <History className="w-5 h-5" />
            </button>
            <button
              onClick={handleClearChat}
              className="p-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all duration-200"
              title="清空对话"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all duration-200"
                title="关闭"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 历史记录侧边栏 */}
        {showHistory && (
          <div className="w-64 flex-shrink-0 border-r border-white/10 overflow-y-auto p-3 space-y-2">
            <div className="text-xs text-white/40 font-medium mb-2">历史对话</div>
            {/* 这里可以添加历史记录列表 */}
            <div className="text-xs text-white/30 text-center py-4">
              暂无历史记录
            </div>
          </div>
        )}

        {/* 对话区域 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 消息列表 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 backdrop-blur-md transition-all duration-300 ${
                    msg.role === 'user'
                      ? `bg-gradient-to-r ${currentModeConfig.color} text-white`
                      : 'bg-white/10 text-white border border-white/10'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2">
                      <ModeIcon className="w-4 h-4 text-white/60" />
                      <span className="text-xs text-white/40">{currentModeConfig.name}</span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  {msg.timestamp && (
                    <div className="text-[10px] text-white/30 mt-2">
                      {msg.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl px-4 py-3 border border-white/10">
                  <div className="flex items-center gap-2">
                    <ModeIcon className="w-4 h-4 text-white/60" />
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-white/40 animate-bounce" />
                      <div className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* 快捷用例 */}
          {showExamples && messages.length <= 1 && (
            <div className="flex-shrink-0 px-4 pb-2">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-white/40" />
                <span className="text-xs text-white/40 font-medium">试试这些</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {QUICK_EXAMPLES[mode].slice(0, 4).map((example, index) => (
                  <button
                    key={index}
                    onClick={() => handleExampleClick(example)}
                    className="px-3 py-1.5 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 text-xs text-white/60 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all duration-200"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 输入框 */}
          <div className="flex-shrink-0 p-4 border-t border-white/10">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder={mode === 'agent' ? '输入您的需求，如"我想去北京玩三天"...' : '输入您的问题...'}
                className="w-full px-4 py-3 pr-14 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 text-white text-sm placeholder-white/30 outline-none focus:bg-white/10 focus:border-white/20 focus:shadow-lg transition-all duration-300"
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={loading || !inputValue.trim()}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-lg bg-gradient-to-r ${currentModeConfig.color} text-white hover:shadow-lg transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="text-[10px] text-white/30 mt-2 text-center">
              按 Enter 发送 · {currentModeConfig.name}模式
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
