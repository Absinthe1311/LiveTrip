// AI 功能页面 - 优化版本
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Send, 
  Bot, 
  MessageCircle,
  History,
  Lightbulb,
  Trash2,
  Plus,
  MessageSquare,
  X
} from 'lucide-react';
import GlassLayout from '../components/GlassLayout';
import { GlassCard } from '../components/home';
import { aiService, ChatMode, ChatSession, Message } from '../services/aiService';

// 快捷用例
const QUICK_EXAMPLES = {
  advisor: [
    '这个目的地有什么特色？',
    '最佳旅行时间是什么时候？',
    '有什么必去的景点？',
    '当地美食推荐',
  ],
  agent: [
    '我想去北京玩三天',
    '帮我规划一个上海两日游',
    '查看我的行程',
    '为上次旅行写一篇游记',
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
    textColor: 'text-[#145F39]',
  },
  agent: {
    name: '智能助手',
    icon: Sparkles,
    description: '创建行程、管理旅行',
    color: 'from-[#AE1C31] to-[#AE1C31]/80',
    bgColor: 'bg-[#AE1C31]/10',
    borderColor: 'border-[#AE1C31]/30',
    textColor: 'text-[#AE1C31]',
  },
};

export default function AIFeaturesGlass() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<ChatMode>('agent');
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showExamples, setShowExamples] = useState(true);
  const [showHistory, setShowHistory] = useState(true); // 控制历史对话显示/隐藏
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 加载历史会话列表
  useEffect(() => {
    loadSessions();
  }, [mode]);

  // 初始化欢迎消息
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage = mode === 'agent'
        ? '您好！我是您的智能旅行助手。我可以帮您创建行程、查看行程、生成游记等。有什么可以帮您的吗？'
        : '您好！我是您的旅行问答助手。关于旅行相关的问题，有什么我可以帮助您的吗？';
      
      setMessages([{
        id: '1',
        role: 'assistant',
        content: welcomeMessage,
        createdAt: new Date().toISOString(),
      }]);
      setShowExamples(true);
    }
  }, [mode]);

  // 加载会话列表
  const loadSessions = async () => {
    try {
      const sessionsData = await aiService.getUserSessions(mode);
      setSessions(sessionsData);
    } catch (error) {
      console.error('加载会话列表失败:', error);
    }
  };

  // 加载会话消息
  const loadSessionMessages = async (sessionId: string) => {
    try {
      const messagesData = await aiService.getSessionMessages(sessionId, 50);
      setMessages(messagesData);
      setCurrentSessionId(sessionId);
      setShowExamples(messagesData.length <= 1);
    } catch (error) {
      console.error('加载会话消息失败:', error);
    }
  };

  // 发送消息
  const handleSend = async () => {
    if (!inputValue.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      createdAt: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setLoading(true);
    setShowExamples(false);

    try {
      let data;
      if (mode === 'agent') {
        data = await aiService.sendAgentMessage(currentInput);
      } else {
        data = await aiService.sendAdvisorMessage(currentInput, {});
      }

      if (data.success && data.data?.answer) {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.data.answer,
          createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, aiResponse]);
        
        // 刷新会话列表
        loadSessions();
      } else {
        throw new Error(data.error || '获取回答失败');
      }
    } catch (error: any) {
      console.error('AI请求失败:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `抱歉，遇到了一些问题：${error.message || '请稍后再试'}`,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  };

  // 清空对话
  const handleClearChat = () => {
    const welcomeMessage = mode === 'agent'
      ? '对话已清空。有什么可以帮您的吗？'
      : '对话已清空。请继续提问。';
    
    setMessages([{
      id: '1',
      role: 'assistant',
      content: welcomeMessage,
      createdAt: new Date().toISOString(),
    }]);
    setCurrentSessionId(null);
    setShowExamples(true);
  };

  // 删除会话
  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await aiService.deleteSession(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (currentSessionId === sessionId) {
        handleClearChat();
      }
    } catch (error) {
      console.error('删除会话失败:', error);
    }
  };

  // 点击用例
  const handleExampleClick = (example: string) => {
    setInputValue(example);
    textareaRef.current?.focus();
  };

  // 自动调整文本框高度
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  const currentModeConfig = MODE_CONFIG[mode];
  const ModeIcon = currentModeConfig.icon;

  return (
    <GlassLayout showSearch={false}>
      <div className="h-[calc(100vh-120px)] flex flex-col">
        {/* 顶部标题栏 */}
        <div className="flex-shrink-0 flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${currentModeConfig.bgColor}`}>
              <ModeIcon className={`h-8 w-8 ${currentModeConfig.textColor}`} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">AI 智能助手</h1>
              <p className="text-white/60">{currentModeConfig.description}</p>
            </div>
          </div>

          {/* 模式切换 */}
          <div className="flex items-center gap-2 p-1 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            {(Object.keys(MODE_CONFIG) as ChatMode[]).map((modeKey) => {
              const config = MODE_CONFIG[modeKey];
              const Icon = config.icon;
              const isActive = mode === modeKey;
              
              return (
                <button
                  key={modeKey}
                  onClick={() => {
                    setMode(modeKey);
                    handleClearChat();
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                    isActive
                      ? `bg-gradient-to-r ${config.color} text-white shadow-lg`
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{config.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 主内容区 */}
        <div className="flex-1 flex gap-4 overflow-hidden">
          {/* 左侧：历史对话 */}
          {showHistory && (
            <div className="w-64 flex-shrink-0">
              <GlassCard className="p-4 h-full overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-white/60" />
                    <span className="text-sm font-medium text-white">历史对话</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleClearChat}
                      className="p-1.5 rounded-lg bg-white/5 text-white/40 hover:text-white/60 hover:bg-white/10 transition-all"
                      title="新建对话"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowHistory(false)}
                      className="p-1.5 rounded-lg bg-white/5 text-white/40 hover:text-white/60 hover:bg-white/10 transition-all"
                      title="隐藏历史"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                  {sessions.length === 0 ? (
                    <div className="text-xs text-white/30 text-center py-4">
                      暂无历史对话
                    </div>
                  ) : (
                    sessions.map((session) => (
                      <div
                        key={session.id}
                        onClick={() => loadSessionMessages(session.id)}
                        className={`group relative p-3 rounded-lg cursor-pointer transition-all ${
                          currentSessionId === session.id
                            ? `${currentModeConfig.bgColor} border ${currentModeConfig.borderColor}`
                            : 'bg-white/5 hover:bg-white/10 border border-transparent'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <MessageSquare className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                            currentSessionId === session.id ? currentModeConfig.textColor : 'text-white/40'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <div className={`text-xs font-medium truncate ${
                              currentSessionId === session.id ? 'text-white' : 'text-white/70'
                            }`}>
                              {session.mode === 'agent' ? '智能助手' : '问答助手'}
                            </div>
                            <div className="text-[10px] text-white/40 mt-0.5">
                              {new Date(session.updatedAt).toLocaleDateString('zh-CN', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        </div>
                        
                        {/* 删除按钮 */}
                        <button
                          onClick={(e) => handleDeleteSession(session.id, e)}
                          className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all"
                        >
                          <Trash2 className="w-3 h-3 text-white/40 hover:text-white/60" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </GlassCard>
            </div>
          )}

          {/* 右侧：对话区域 */}
          <GlassCard className="flex-1 p-4 flex flex-col overflow-hidden relative">
            {/* 消息列表 */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 backdrop-blur-md transition-all duration-300 ${
                      msg.role === 'user'
                        ? `bg-gradient-to-r ${currentModeConfig.color} text-white`
                        : 'bg-white/10 text-white border border-white/10'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2">
                        <ModeIcon className={`w-4 h-4 ${currentModeConfig.textColor}`} />
                        <span className="text-xs text-white/40">{currentModeConfig.name}</span>
                      </div>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    {msg.createdAt && (
                      <div className="text-[10px] text-white/30 mt-2">
                        {new Date(msg.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl px-4 py-3 border border-white/10">
                    <div className="flex items-center gap-2">
                      <ModeIcon className={`w-4 h-4 ${currentModeConfig.textColor}`} />
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

            {/* 快捷用例 - 显示在输入框上方 */}
            {showExamples && messages.length <= 1 && (
              <div className="flex-shrink-0 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-white/40" />
                  <span className="text-xs text-white/40 font-medium">试试这些</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {QUICK_EXAMPLES[mode].map((example, index) => (
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

            {/* 输入框 - 使用 textarea 实现自动换行 */}
            <div className="flex-shrink-0">
              <div className="relative">
                {/* 显示历史对话按钮（当历史被隐藏时） */}
                {!showHistory && (
                  <button
                    onClick={() => setShowHistory(true)}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full -ml-2 p-2 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 text-white/40 hover:text-white/60 hover:bg-white/10 transition-all"
                    title="显示历史对话"
                  >
                    <History className="w-4 h-4" />
                  </button>
                )}
                
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    adjustTextareaHeight();
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={mode === 'agent' ? '输入您的需求，如"我想去北京玩三天"...' : '输入您的问题...'}
                  className="w-full px-4 py-3 pr-14 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 text-white text-sm placeholder-white/30 outline-none focus:bg-white/10 focus:border-white/20 focus:shadow-lg transition-all duration-300 resize-none overflow-y-auto"
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                  rows={1}
                  disabled={loading}
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !inputValue.trim()}
                  className={`absolute right-2 bottom-2 p-2.5 rounded-lg bg-gradient-to-r ${currentModeConfig.color} text-white hover:shadow-lg transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="text-[10px] text-white/30 mt-2 text-center">
                按 Enter 发送 · Shift + Enter 换行 · {currentModeConfig.name}模式
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </GlassLayout>
  );
}
