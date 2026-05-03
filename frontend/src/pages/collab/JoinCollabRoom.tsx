// AI辅助生成：GLM-5, 2026-4-7
// 加入协同房间页面 - 通过邀请链接加入协同规划（毛玻璃风格优化版）
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Users, AlertCircle, Loader, Link, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { message } from 'antd';
import { joinCollabRoom } from '../../api/collabApi';
import { Sidebar } from '../../components/layout/SharedSidebar';

// AI辅助生成：GLM-5, 2026-4-7
export default function JoinCollabRoom() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlToken = searchParams.get('token');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string>('');
  const [inviteLink, setInviteLink] = useState<string>('');

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

  useEffect(() => {
    if (urlToken) {
      handleJoinRoom(urlToken);
    }
  }, [urlToken]);

  const handleJoinRoom = async (token?: string) => {
    const joinToken = token || extractTokenFromLink(inviteLink);

    if (!joinToken) {
      setError('请输入有效的邀请链接');
      message.error('请输入有效的邀请链接');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await joinCollabRoom(joinToken);

      if (response.success) {
        setRoomId(response.data.id);
        message.success('成功加入协同房间！');
        // 自动跳转到协同房间
        setTimeout(() => {
          navigate(`/collab/room/${response.data.id}`);
        }, 1500);
      } else {
        setError(response.error || '加入房间失败');
        message.error(response.error || '加入房间失败');
      }
    } catch (err: any) {
      console.error('加入协同房间失败:', err);
      setError(err.response?.data?.error || err.message || '加入房间失败');
      message.error(err.response?.data?.error || err.message || '加入房间失败');
    } finally {
      setLoading(false);
    }
  };

  // 从链接中提取token
  const extractTokenFromLink = (link: string): string | null => {
    try {
      const url = new URL(link);
      return url.searchParams.get('token');
    } catch {
      // 如果不是完整URL，尝试直接作为token
      return link || null;
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* 全屏背景 */}
      <div
        className="fixed inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/homepage-bg.jpg')" }}
      />

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
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <span className="text-xl font-bold text-white">LiveTrip</span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold text-white">加入协同规划</h1>
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
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">加入协同规划</h2>
            </div>

            {loading && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader className="h-12 w-12 text-amber-400 animate-spin mb-6" />
                <p className="text-white/70 text-lg">正在加入协同房间...</p>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 backdrop-blur-md border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            )}

            {!loading && !error && roomId && (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-green-500/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="h-10 w-10 text-green-400" />
                </div>
                <p className="text-green-400 text-lg mb-2">✓ 成功加入协同房间！</p>
                <p className="text-white/70">正在跳转到协同房间...</p>
              </div>
            )}

            {!urlToken && !loading && !roomId && (
              <div className="space-y-6">
                <p className="text-white/70 mb-4 leading-relaxed">
                  请输入或粘贴邀请链接以加入协同规划房间
                </p>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-3">
                    <Link className="inline h-4 w-4 mr-2" />
                    邀请链接
                  </label>
                  <input
                    type="text"
                    value={inviteLink}
                    onChange={(e) => setInviteLink(e.target.value)}
                    placeholder="例如: http://localhost:5173/collab/join?token=xxx"
                    className="w-full px-6 py-4 text-lg rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all duration-300"
                  />
                </div>

                <button
                  onClick={() => handleJoinRoom()}
                  disabled={!inviteLink.trim()}
                  className="relative w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold text-lg border border-white/20 shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 hover:scale-105 active:scale-95 transition-all duration-300 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                  <span className="relative flex items-center justify-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    加入房间
                    <ArrowRight className="h-5 w-5" />
                  </span>
                </button>

                <div className="mt-8 p-6 bg-blue-500/10 backdrop-blur-md border border-blue-500/20 rounded-xl">
                  <h3 className="font-semibold text-blue-400 mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    使用说明
                  </h3>
                  <ul className="text-sm text-blue-300/80 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-1">•</span>
                      <span>从房主处获取邀请链接</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-1">•</span>
                      <span>粘贴完整链接或仅粘贴token部分</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-1">•</span>
                      <span>点击"加入房间"即可参与协同规划</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
