// AI 功能页面 - 美化版本
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
  X,
  User,
  MapPin,
  Calendar,
  FileText,
  Heart
} from 'lucide-react';
import GlassLayout from '../components/GlassLayout';
import { GlassCard } from '../components/home';
import { aiService, ChatMode, ChatSession, Message } from '../services/aiService';

// 快捷用例 - 更符合AI Agent标准输入
const QUICK_EXAMPLES = {
  advisor: [
    { icon: MapPin, text: '北京有哪些必去的景点？每个景点需要多长时间游览？' },
    { icon: Calendar, text: '我想去三亚旅游，什么季节最合适？有什么注意事项？' },
    { icon: Sparkles, text: '推荐一条适合家庭出游的云南7日游路线，包含交通和住宿建议' },
    { icon: FileText, text: '第一次出国旅行需要准备哪些证件？签证办理流程是什么？' },
    { icon: MapPin, text: '详细介绍故宫的历史背景、开放时间、门票价格和游览路线' },
    { icon: Heart, text: '如何制定一个合理的旅行预算？有哪些省钱技巧？' },
  ],
  agent: [
    { icon: MapPin, text: '帮我规划一个北京三日游行程，预算3000元，喜欢历史文化' },
    { icon: FileText, text: '查看我所有的旅行计划，并按时间排序' },
    { icon: Sparkles, text: '为上次的云南旅行写一篇游记，重点介绍美食体验' },
    { icon: Heart, text: '推荐5个适合情侣的浪漫旅行目的地，预算5000元左右' },
  ],
};

// 欢迎消息 - 移除emoji
const WELCOME_MESSAGES = {
  advisor: '您好！我是您的旅行问答助手。\n\n我可以帮您解答关于旅行目的地、行程规划、预算安排、旅行攻略等问题。请随时向我提问！',
  agent: '您好！我是您的智能旅行助手。\n\n我可以帮您：\n- 创建和规划旅行行程\n- 查看和管理您的旅行计划\n- 生成和发布旅行游记\n- 推荐景点和目的地\n\n请告诉我您需要什么帮助？',
};

// 模式配置 - 使用UI设计指导配色
const MODE_CONFIG = {
  advisor: {
    name: '问答助手',
    icon: MessageCircle,
    description: '回答旅行相关问题',
    color: 'from-[#008F8D] to-[#008F8D]/80', // 马尔斯绿
    bgColor: 'bg-[#008F8D]/10',
    borderColor: 'border-[#008F8D]/30',
    textColor: 'text-[#008F8D]',
  },
  agent: {
    name: '智能助手',
    icon: Sparkles,
    description: '创建行程、管理旅行',
    color: 'from-[#AE1C31] to-[#AE1C31]/80', // 圣诞红
    bgColor: 'bg-[#AE1C31]/10',
    borderColor: 'border-[#AE1C31]/30',
    textColor: 'text-[#AE1C31]',
  },
};

// 获取用户信息
function getUserInfo() {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      return {
        id: user.id || user.userId,
        avatar: user.avatar || null,
        nickname: user.nickname || user.username || '用户',
      };
    } catch (e) {
      return null;
    }
  }
  return null;
}

export default function AIFeaturesGlass() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<ChatMode>('advisor'); // 默认为问答助手
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showExamples, setShowExamples] = useState(true);
  const [showHistory, setShowHistory] = useState(true);
  const [userInfo, setUserInfo] = useState(getUserInfo());
  
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

  // 监听用户信息变化
  useEffect(() => {
    const updateUserInfo = () => {
      setUserInfo(getUserInfo());
    };
    
    // 初始加载
    updateUserInfo();
    
    // 监听 storage 事件
    window.addEventListener('storage', updateUserInfo);
    
    // 定期检查用户信息（处理同一标签页的更新）
    const interval = setInterval(updateUserInfo, 1000);
    
    return () => {
      window.removeEventListener('storage', updateUserInfo);
      clearInterval(interval);
    };
  }, []);

  // 初始化欢迎消息
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: '1',
        role: 'assistant',
        content: WELCOME_MESSAGES[mode],
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
    setMessages([{
      id: Date.now().toString(),
      role: 'assistant',
      content: WELCOME_MESSAGES[mode],
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
                          className="absolute top-2 right-2 p-1 rounded hover:bg-white/10 transition-all"
                          title="删除对话"
                        >
                          <Trash2 className="w-3 h-3 text-white/40 hover:text-red-400" />
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
            {/* 显示历史对话按钮 */}
            {!showHistory && (
              <button
                onClick={() => setShowHistory(true)}
                className="absolute left-4 top-4 z-10 p-2 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 text-white/40 hover:text-white/60 hover:bg-white/10 transition-all"
                title="显示历史对话"
              >
                <History className="w-4 h-4" />
              </button>
            )}
            
            {/* 消息列表 */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {/* AI 头像 */}
                  {msg.role === 'assistant' && (
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full ${currentModeConfig.bgColor} flex items-center justify-center`}>
                      <Bot className={`w-5 h-5 ${currentModeConfig.textColor}`} />
                    </div>
                  )}
                  
                  {/* 消息内容 */}
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 backdrop-blur-md transition-all duration-300 ${
                      msg.role === 'user'
                        ? `bg-gradient-to-r ${currentModeConfig.color} text-white`
                        : 'bg-white/10 text-white border border-white/10'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    {msg.createdAt && (
                      <div className="text-[10px] text-white/30 mt-2">
                        {new Date(msg.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                  
                  {/* 用户头像 */}
                  {msg.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20 overflow-hidden">
                      {userInfo?.avatar ? (
                        <img 
                          src={userInfo.avatar} 
                          alt="用户头像" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-white/60" />
                      )}
                    </div>
                  )}
                </div>
              ))}
              
              {loading && (
                <div className="flex gap-3 justify-start">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full ${currentModeConfig.bgColor} flex items-center justify-center`}>
                    <Bot className={`w-5 h-5 ${currentModeConfig.textColor}`} />
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl px-4 py-3 border border-white/10">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-white/40 animate-bounce" />
                      <div className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* 快捷用例 */}
            {showExamples && messages.length <= 1 && (
              <div className="flex-shrink-0 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-white/40" />
                  <span className="text-xs text-white/40 font-medium">您可以这样问我</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {QUICK_EXAMPLES[mode].map((example, index) => {
                    const IconComponent = example.icon;
                    return (
                      <button
                        key={index}
                        onClick={() => handleExampleClick(example.text)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 text-xs text-white/60 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all duration-200"
                      >
                        <IconComponent className="w-3.5 h-3.5" />
                        <span>{example.text}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 输入框 */}
            <div className="flex-shrink-0">
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => {
                    if (!loading) {
                      setInputValue(e.target.value);
                      adjustTextareaHeight();
                    }
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !loading) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={loading ? 'AI 正在思考中，请稍候...' : (mode === 'agent' ? '输入您的需求，如"我想去北京玩三天"...' : '输入您的问题...')}
                  className={`w-full px-4 py-3 pr-14 rounded-xl backdrop-blur-md border text-white text-sm outline-none transition-all duration-300 resize-none overflow-y-auto ${
                    loading 
                      ? 'bg-white/5 border-white/5 text-white/30 cursor-not-allowed' 
                      : 'bg-white/5 border-white/10 placeholder-white/30 focus:bg-white/10 focus:border-white/20 focus:shadow-lg'
                  }`}
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                  rows={1}
                  disabled={loading}
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !inputValue.trim()}
                  className={`absolute right-2 bottom-2 p-2.5 rounded-lg text-white transition-all duration-300 ${
                    loading 
                      ? 'bg-white/10 cursor-not-allowed opacity-30' 
                      : `bg-gradient-to-r ${currentModeConfig.color} hover:shadow-lg disabled:opacity-30 disabled:cursor-not-allowed`
                  }`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="text-[10px] text-white/30 mt-2 text-center">
                {loading ? 'AI 正在回答，请等待...' : `按 Enter 发送 · Shift + Enter 换行 · ${currentModeConfig.name}模式`}
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </GlassLayout>
  );
}
