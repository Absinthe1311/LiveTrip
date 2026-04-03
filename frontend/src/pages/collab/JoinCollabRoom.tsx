// 加入协同房间页面 - 通过邀请链接加入协同规划
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Menu, Users, AlertCircle, Loader, Link, ArrowRight } from 'lucide-react';
import { joinCollabRoom } from '../../api/collabApi';
import { Sidebar } from '../../components/SharedSidebar';

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
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await joinCollabRoom(joinToken);
      
      if (response.success) {
        setRoomId(response.data.id);
        // 自动跳转到协同房间
        setTimeout(() => {
          navigate(`/collab/room/${response.data.id}`);
        }, 1500);
      } else {
        setError(response.error || '加入房间失败');
      }
    } catch (err: any) {
      console.error('加入协同房间失败:', err);
      setError(err.response?.data?.error || err.message || '加入房间失败');
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
    <div className="min-h-screen bg-livetrip-background">
      {/* Top Navbar */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-border z-50 flex items-center shadow-subtle">
        <div className="w-[220px] h-full flex items-center px-4 border-r border-border shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2 rounded-lg hover:bg-gray-100 transition-colors mr-2 ${isLargeScreen ? 'hidden' : 'block'}`}
          >
            <Menu className="h-5 w-5 text-gray-700" />
          </button>
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <span className="text-xl font-bold text-livetrip-primary">LiveTrip</span>
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold text-gray-900">加入协同规划</h1>
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
      <main className={`pt-14 ${isLargeScreen ? 'pl-[240px]' : ''} min-h-screen`}>
        <div className="max-w-2xl mx-auto p-6">
          <div className="bg-white rounded-lg border border-border shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <Users className="h-6 w-6 text-livetrip-primary" />
              <h2 className="text-xl font-semibold">加入协同规划</h2>
            </div>

            {loading && (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader className="h-8 w-8 text-livetrip-primary animate-spin mb-4" />
                <p className="text-gray-600">正在加入协同房间...</p>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            )}

            {!loading && !error && roomId && (
              <div className="text-center py-8">
                <p className="text-green-600 mb-4">✓ 成功加入协同房间！</p>
                <p className="text-gray-600">正在跳转到协同房间...</p>
              </div>
            )}

            {!urlToken && !loading && !roomId && (
              <div className="space-y-4">
                <p className="text-gray-600 mb-4">
                  请输入或粘贴邀请链接以加入协同规划房间
                </p>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Link className="inline h-4 w-4 mr-1" />
                    邀请链接
                  </label>
                  <input
                    type="text"
                    value={inviteLink}
                    onChange={(e) => setInviteLink(e.target.value)}
                    placeholder="例如: http://localhost:5173/collab/join?token=xxx"
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-livetrip-primary/20"
                  />
                </div>
                
                <button
                  onClick={() => handleJoinRoom()}
                  disabled={!inviteLink.trim()}
                  className="w-full py-3 bg-livetrip-primary text-white rounded-lg font-medium hover:bg-livetrip-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  加入房间
                  <ArrowRight className="h-5 w-5" />
                </button>
                
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">💡 使用说明</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• 从房主处获取邀请链接</li>
                    <li>• 粘贴完整链接或仅粘贴token部分</li>
                    <li>• 点击"加入房间"即可参与协同规划</li>
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
