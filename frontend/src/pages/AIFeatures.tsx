// AI 功能页面 - 支持问答助手和智能助手两种模式
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Search, Bell, Heart, Send, Sparkles, MessageCircle, Bot, Trash2, Clock } from "lucide-react";
import { Sidebar } from '../components/SharedSidebar';
import { aiService, ChatMode, Message as AIMessage, ChatSession } from '../services/aiService';

const ADVISOR_QUICK_QUESTIONS = [
  "北京有哪些必去景点？",
  "如何规划三天行程？",
  "旅行预算怎么控制？",
  "当地美食推荐",
  "需要注意什么？",
];

const AGENT_QUICK_QUESTIONS = [
  "帮我创建一个北京三日游行程",
  "查看我的所有行程",
  "为上次旅行生成一篇博客",
  "推荐一个适合周末的短途旅行",
  "帮我规划一次东京之旅",
];

export default function AIFeatures() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  
  // 聊天状态
  const [mode, setMode] = useState<ChatMode>('advisor');
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 历史记录状态
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // 加载会话列表
  useEffect(() => {
    loadSessions();
  }, [mode]);

  // 加载会话消息
  useEffect(() => {
    if (currentSessionId) {
      loadSessionMessages(currentSessionId);
    } else {
      // 新会话，显示欢迎消息
      setMessages(getWelcomeMessage(mode));
    }
  }, [currentSessionId, mode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getWelcomeMessage = (currentMode: ChatMode): AIMessage[] => {
    if (currentMode === 'advisor') {
      return [{
        id: 'welcome',
        role: 'assistant',
        content: '你好！我是你的 AI 旅行顾问 🌍\n\n我可以帮你：\n• 规划个性化行程\n• 推荐景点和美食\n• 解答旅行相关问题\n• 提供实时旅行建议\n\n有什么我可以帮助你的吗？',
      }];
    } else {
      return [{
        id: 'welcome',
        role: 'assistant',
        content: '你好！我是你的智能旅行助手 🤖\n\n我可以帮你：\n• 创建旅行行程（通过对话）\n• 查看和管理你的行程\n• 为完成的旅行生成博客\n\n试试说：\n• "帮我创建一个北京三日游"\n• "查看我的所有行程"\n• "为上次旅行生成博客"',
      }];
    }
  };

  const loadSessions = async () => {
    try {
      const sessionList = await aiService.getUserSessions(mode);
      setSessions(sessionList);
    } catch (error) {
      console.error('加载会话列表失败:', error);
    }
  };

  const loadSessionMessages = async (sessionId: string) => {
    try {
      const sessionMessages = await aiService.getSessionMessages(sessionId);
      setMessages(sessionMessages);
    } catch (error) {
      console.error('加载会话消息失败:', error);
    }
  };

  const handleNewSession = () => {
    setCurrentSessionId(null);
    setMessages(getWelcomeMessage(mode));
  };

  const handleSelectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setHistoryOpen(false);
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await aiService.deleteSession(sessionId);
      if (currentSessionId === sessionId) {
        handleNewSession();
      }
      loadSessions();
    } catch (error) {
      console.error('删除会话失败:', error);
    }
  };

  const handleSendMessage = async (message?: string) => {
    const text = message || inputValue.trim();
    if (!text) return;

    const userMessage: AIMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      let data;
      if (mode === 'advisor') {
        data = await aiService.sendAdvisorMessage(text);
      } else {
        data = await aiService.sendAgentMessage(text);
      }

      if (data.success && data.data?.answer) {
        const aiResponse: AIMessage = {
          id: `assistant_${Date.now()}`,
          role: 'assistant',
          content: data.data.answer,
        };
        setMessages(prev => [...prev, aiResponse]);
        
        // 刷新会话列表
        loadSessions();
      } else {
        throw new Error(data.error || '获取回答失败');
      }
    } catch (error: any) {
      console.error('❌ AI请求失败:', error);
      const errorMessage: AIMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: `抱歉，AI暂时无法使用。错误信息：${error.message || '请稍后再试'}`,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleModeChange = (newMode: ChatMode) => {
    setMode(newMode);
    setCurrentSessionId(null);
    setHistoryOpen(false);
  };

  const getQuickQuestions = () => {
    return mode === 'advisor' ? ADVISOR_QUICK_QUESTIONS : AGENT_QUICK_QUESTIONS;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className="min-h-screen bg-livetrip-background">
      {/* Top Navbar */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-border z-50 flex items-center shadow-subtle">
        <div className="w-[220px] h-full flex items-center px-4 border-r border-border shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className={`p-2 rounded-lg hover:bg-gray-100 transition-colors mr-2 ${isLargeScreen ? 'hidden' : 'block'}`}>
            <Menu className="h-5 w-5 text-gray-700" />
          </button>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-9 h-9 bg-livetrip-primary rounded-lg flex items-center justify-center"><span className="text-lg">✈️</span></div>
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-semibold text-livetrip-primary-dark font-serif">LiveTrip</span>
              <span className="text-[10px] text-livetrip-primary font-medium tracking-wide">AI · IoT · Travel</span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-6">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" placeholder="搜索目的地、景点、攻略…" className="w-full h-10 pl-10 pr-4 rounded-full bg-gray-100 border-none outline-none text-sm focus:ring-2 focus:ring-livetrip-primary/20 transition-all" />
          </div>
        </div>

        <div className="flex items-center gap-1 px-4">
          <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <button onClick={() => navigate('/favorites')} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Heart className="h-5 w-5 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-livetrip-primary to-emerald-400 flex items-center justify-center text-white text-xs font-medium">ZL</div>
            <span className={`text-sm font-medium text-livetrip-primary-dark ${isLargeScreen ? 'block' : 'hidden'}`}>Zhang Lei</span>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        isLargeScreen={isLargeScreen}
        currentPage={location.pathname}
      />

      {/* Main Content */}
      <main className={`pt-14 min-h-screen ${isLargeScreen ? 'lg:pl-[240px]' : ''}`}>
        <div className="flex h-[calc(100vh-3.5rem)]">
          {/* 历史记录侧边栏 */}
          {historyOpen && (
            <div className="w-64 border-r border-border bg-card overflow-y-auto">
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">对话历史</h3>
                  <button
                    onClick={handleNewSession}
                    className="px-3 py-1.5 rounded-lg bg-livetrip-primary text-white text-xs hover:bg-livetrip-primary-dark transition-colors"
                  >
                    + 新对话
                  </button>
                </div>
                {mode === 'advisor' ? (
                  <button className="w-full px-3 py-2 rounded-lg bg-livetrip-primary-light text-livetrip-primary text-xs font-medium">
                    <MessageCircle className="w-3 h-3 inline mr-1" />
                    问答助手
                  </button>
                ) : (
                  <button className="w-full px-3 py-2 rounded-lg bg-livetrip-primary-light text-livetrip-primary text-xs font-medium">
                    <Bot className="w-3 h-3 inline mr-1" />
                    智能助手
                  </button>
                )}
              </div>
              <div className="p-2">
                {sessions.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">暂无对话历史</p>
                ) : (
                  sessions.map(session => (
                    <div
                      key={session.id}
                      onClick={() => handleSelectSession(session.id)}
                      className={`p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors mb-1 ${
                        currentSessionId === session.id ? 'bg-livetrip-primary-light' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">
                            {mode === 'advisor' ? '问答对话' : '智能助手对话'}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatTime(session.updatedAt)}
                          </p>
                        </div>
                        <button
                          onClick={(e) => handleDeleteSession(session.id, e)}
                          className="p-1 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-3 h-3 text-red-400" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 聊天区域 */}
          <div className="flex-1 max-w-4xl mx-auto flex flex-col">
            {/* Page Header */}
            <div className="px-6 py-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="font-serif text-xl font-semibold text-foreground">
                    {mode === 'advisor' ? 'AI 旅行顾问' : '智能旅行助手'}
                  </h1>
                  <p className="text-[13px] text-muted-foreground mt-0.5">
                    {mode === 'advisor' 
                      ? '智能对话，为你提供专业的旅行建议和规划服务'
                      : '通过对话创建行程、查看行程、生成博客'
                    }
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setHistoryOpen(!historyOpen)}
                    className="px-3 py-1.5 rounded-lg border border-border hover:bg-gray-50 transition-colors text-xs"
                  >
                    <Clock className="w-3 h-3 inline mr-1" />
                    历史记录
                  </button>
                  {currentSessionId && (
                    <button
                      onClick={handleNewSession}
                      className="px-3 py-1.5 rounded-lg bg-livetrip-primary text-white text-xs hover:bg-livetrip-primary-dark transition-colors"
                    >
                      + 新对话
                    </button>
                  )}
                </div>
              </div>
              
              {/* 模式切换器 */}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleModeChange('advisor')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    mode === 'advisor'
                      ? 'bg-livetrip-primary text-white'
                      : 'bg-gray-100 text-foreground hover:bg-gray-200'
                  }`}
                >
                  <MessageCircle className="w-4 h-4 inline mr-2" />
                  问答助手
                </button>
                <button
                  onClick={() => handleModeChange('agent')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    mode === 'agent'
                      ? 'bg-livetrip-primary text-white'
                      : 'bg-gray-100 text-foreground hover:bg-gray-200'
                  }`}
                >
                  <Bot className="w-4 h-4 inline mr-2" />
                  智能助手
                </button>
              </div>
            </div>

            {/* Chat Container */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map(message => (
                  <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`}>
                    {message.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-livetrip-primary flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                      message.role === "assistant" 
                        ? "bg-muted rounded-2xl rounded-tl-sm text-foreground" 
                        : "bg-livetrip-primary text-white rounded-2xl rounded-tr-sm"
                    }`}>
                      {message.content}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-livetrip-primary flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Questions */}
              <div className="border-t border-border p-4 bg-muted/30">
                <p className="text-xs text-muted-foreground mb-2">常见问题：</p>
                <div className="flex flex-wrap gap-2">
                  {getQuickQuestions().map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(question)}
                      className="px-3 py-1.5 rounded-full text-xs bg-secondary text-primary border border-primary/20 hover:bg-primary hover:text-white transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Area */}
              <div className="border-t border-border p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSendMessage(); }}
                    placeholder={mode === 'advisor' ? "输入你的问题..." : "告诉我你的需求..."}
                    className="flex-1 h-10 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputValue.trim()}
                    className="w-10 h-10 bg-livetrip-primary hover:bg-livetrip-primary-dark text-white rounded-lg flex items-center justify-center disabled:opacity-50 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
