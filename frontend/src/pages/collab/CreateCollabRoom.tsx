// 创建协同房间页面 - Host创建协同规划房间
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Menu, Users, Link, CheckCircle, AlertCircle } from 'lucide-react';
import { createCollabRoom } from '../../api/collabApi';
import { Sidebar } from '../../components/SharedSidebar';

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
      } else {
        setError(response.error || '创建房间失败');
      }
    } catch (err: any) {
      console.error('创建协同房间失败:', err);
      setError(err.message || '创建房间失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    alert('邀请链接已复制到剪贴板！');
  };

  const handleEnterRoom = () => {
    navigate(`/collab/room/${roomId}`);
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
          <h1 className="text-lg font-semibold text-gray-900">创建协同规划房间</h1>
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
          {!success ? (
            <div className="bg-white rounded-lg border border-border shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <Users className="h-6 w-6 text-livetrip-primary" />
                <h2 className="text-xl font-semibold">创建协同规划房间</h2>
              </div>

              <p className="text-gray-600 mb-6">
                创建协同规划房间后，您可以邀请朋友一起规划行程。每个人可以独立绘制自己建议的路线，您可以参考统计数据后确定最终路线。
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-5 w-5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={handleCreateRoom}
                disabled={loading}
                className="w-full py-3 bg-livetrip-primary text-white rounded-lg font-medium hover:bg-livetrip-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '创建中...' : '创建协同房间'}
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-border shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <CheckCircle className="h-6 w-6 text-green-500" />
                <h2 className="text-xl font-semibold">房间创建成功！</h2>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  邀请链接
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inviteLink}
                    readOnly
                    className="flex-1 px-3 py-2 border border-border rounded-lg bg-gray-50 text-gray-600"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2 bg-livetrip-primary text-white rounded-lg hover:bg-livetrip-primary/90 transition-colors flex items-center gap-2"
                  >
                    <Link className="h-4 w-4" />
                    复制
                  </button>
                </div>
              </div>

              <p className="text-gray-600 mb-6 text-sm">
                邀请链接有效期为72小时。将此链接分享给您的朋友，他们可以通过链接加入协同规划。
              </p>

              <button
                onClick={handleEnterRoom}
                className="w-full py-3 bg-livetrip-primary text-white rounded-lg font-medium hover:bg-livetrip-primary/90 transition-colors"
              >
                进入协同房间
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
