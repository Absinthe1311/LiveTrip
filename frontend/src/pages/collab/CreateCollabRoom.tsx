// 创建协同房间页面 - Host创建协同规划房间（毛玻璃风格优化版）
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Users, Link, CheckCircle, AlertCircle, Sparkles, Share2, ArrowRight } from 'lucide-react';
import { message } from 'antd';
import { createCollabRoom } from '../../api/collabApi';
import { Sidebar } from '../../components/layout/SharedSidebar';

export default function CreateCollabRoom() {
  const navigate = useNavigate();
  const { tripId } = useParams<{ tripId: string }>();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [inviteLink, setInviteLink] = useState<string>('');
  const [roomId, setRoomId] = useState<string>('');
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleCreateRoom = async () => {
    if (!tripId) {
      setError('缺少行程ID');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await createCollabRoom(tripId);
      
      if (response.success) {
        setSuccess(true);
        setInviteLink(response.data.inviteLink);
        setRoomId(response.data.room.id);
        message.success('房间创建成功！');
      } else {
        setError(response.error || '创建房间失败');
        message.error(response.error || '创建房间失败');
      }
    } catch (err: any) {
      console.error('创建协同房间失败:', err);
      setError(err.message || '创建房间失败');
      message.error(err.message || '创建房间失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    message.success('邀请链接已复制到剪贴板！');
  };

  const handleEnterRoom = () => {
    navigate(`/collab/room/${roomId}`);
  };

  return (
    <div className="min-h-screen relative">
      {/* 全屏背景 */}
      <div className="fixed inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/homepage-bg.jpg')" }} />
      
      {/* 背景模糊层 */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xl" />
      
      {/* 动态光影效果 */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-amber-600/5 animate-pulse" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Top Navbar */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white/5 backdrop-blur-md border-b border-white/10 z-50 flex items-center">
        <div className="w-[220px] h-full flex items-center px-4 border-r border-white/10 shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2 rounded-lg hover:bg-white/10 transition-colors mr-2 ${isLargeScreen ? 'hidden' : 'block'}`}
          >
            <Users className="h-5 w-5 text-white" />
          </button>
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <span className="text-xl font-bold text-white">LiveTrip</span>
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold text-white">创建协同规划房间</h1>
        </div>
      </header>

      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        isLargeScreen={isLargeScreen}
        currentPage="/my-trips"
      />

      {/* Main Content */}
      <main className={`pt-14 ${isLargeScreen ? 'pl-[240px]' : ''} min-h-screen relative z-10`}>
        <div className="max-w-2xl mx-auto p-6">
          {!success ? (
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">创建协同规划房间</h2>
              </div>

              <p className="text-white/70 mb-8 leading-relaxed">
                创建协同规划房间后，您可以邀请朋友一起规划行程。每个人可以独立绘制自己建议的路线，您可以参考统计数据后确定最终路线。
              </p>

              {error && (
                <div className="mb-6 p-4 bg-red-500/10 backdrop-blur-md border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
                  <AlertCircle className="h-5 w-5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={handleCreateRoom}
                disabled={loading}
                className="relative w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold text-lg border border-white/20 shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 hover:scale-105 active:scale-95 transition-all duration-300 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                <span className="relative flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      创建中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      创建协同房间
                    </>
                  )}
                </span>
              </button>
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">房间创建成功！</h2>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-white/80 mb-3">
                  <Share2 className="inline h-4 w-4 mr-2" />
                  邀请链接
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={inviteLink}
                    readOnly
                    className="flex-1 px-6 py-4 text-lg rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white/80 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-6 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-amber-500/40 hover:scale-105 active:scale-95 transition-all duration-300 border border-white/20 flex items-center gap-2"
                  >
                    <Link className="h-5 w-5" />
                    复制
                  </button>
                </div>
              </div>

              <p className="text-white/70 mb-8 text-sm leading-relaxed">
                邀请链接有效期为72小时。将此链接分享给您的朋友，他们可以通过链接加入协同规划。
              </p>

              <button
                onClick={handleEnterRoom}
                className="relative w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold text-lg border border-white/20 shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 hover:scale-105 active:scale-95 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                <span className="relative flex items-center justify-center gap-2">
                  进入协同房间
                  <ArrowRight className="h-5 w-5" />
                </span>
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}



