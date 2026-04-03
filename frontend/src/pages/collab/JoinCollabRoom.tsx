// 加入协同房间页面 - 通过邀请链接加入协同规划
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Menu, Users, AlertCircle, Loader } from 'lucide-react';
import { joinCollabRoom } from '../../api/collabApi';
import { Sidebar } from '../../components/SharedSidebar';

export default function JoinCollabRoom() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  useEffect(() => {
    if (token) {
      handleJoinRoom();
    }
  }, [token]);

  const handleJoinRoom = async () => {
    if (!token) {
      setError('缺少邀请token');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await joinCollabRoom(token);
      
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
      setError(err.message || '加入房间失败');
    } finally {
      setLoading(false);
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
                <p className="text-green-600 mb-4">成功加入协同房间！</p>
                <p className="text-gray-600">正在跳转到协同房间...</p>
              </div>
            )}

            {!token && !loading && (
              <div className="text-center py-8">
                <p className="text-gray-600">无效的邀请链接</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
