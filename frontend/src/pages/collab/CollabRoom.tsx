// 协同编辑主页面 - 多人协同规划行程的核心界面（集成地图功能）
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Menu, Users, MessageCircle, MapPin, Send, Lock, Eye, Loader, Copy, Check, Share2 } from 'lucide-react';
import { Sidebar } from '../../components/SharedSidebar';
import { useCollabStore } from '../../store/collabStore';
import { getCollabRoomInfo, getUserDrafts, getCollabMessages, getSpotStats, lockCollabRoom, sendCollabMessage, upsertDraft, submitDraft, getCitySpots, getAllDrafts } from '../../api/collabApi';
import { connectSocket, disconnectSocket, joinRoom, leaveRoom, updateDraft } from '../../services/collabSocket';
import { useCollabMap, Spot, RoutePoint } from '../../hooks/useCollabMap';
import LayerControl from '../../components/collab/LayerControl';
import RouteEditor, { RouteSpot } from '../../components/collab/RouteEditor';
import SpotStatsPanel from '../../components/collab/SpotStatsPanel';

export default function CollabRoom() {
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [citySpots, setCitySpots] = useState<Spot[]>([]);
  const [routeSpots, setRouteSpots] = useState<RouteSpot[]>([]);
  const [showStats, setShowStats] = useState(false);
  const [copied, setCopied] = useState(false);
  const [statsData, setStatsData] = useState<any[]>([]);
  const [destination, setDestination] = useState<string>('');
  const [allMemberDrafts, setAllMemberDrafts] = useState<any[]>([]);
  const [showAllRoutes, setShowAllRoutes] = useState(false);
  
  const {
    currentRoom,
    members,
    messages,
    currentDay,
    onlineUsers,
    visibleLayers,
    setCurrentRoom,
    setMembers,
    setMessages,
    setMyDrafts,
    setCurrentDay,
    setSpotStats,
    toggleLayer,
    setVisibleLayers,
    reset,
  } = useCollabStore();
  
  // 计算行程总天数
  const totalDays = currentRoom?.trip ? 
    Math.ceil((new Date(currentRoom.trip.endDate).getTime() - new Date(currentRoom.trip.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1 
    : 1;
  
  // 生成邀请链接
  const inviteLink = currentRoom?.inviteToken 
    ? `${window.location.origin}/collab/join?token=${currentRoom.inviteToken}`
    : '';
  
  // 复制邀请链接
  const handleCopyInviteLink = async () => {
    if (!inviteLink) return;
    
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const messageListRef = useRef<HTMLDivElement>(null);
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token') || '';

  // 地图Hook
  const {
    addSpotMarker,
    clearAllMarkers,
    drawRoute,
    clearRoute,
    showSpotStats: displaySpotStats,
    hideSpotStats,
    setCityWithBoundary,
    isLoaded: isMapLoaded,
  } = useCollabMap({
    containerId: 'collab-map',
    onSpotClick: handleSpotClick,
  });

  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    if (roomId) {
      loadRoomData();
    }

    return () => {
      if (currentRoom && currentUser.id) {
        leaveRoom(currentRoom.id, currentUser.id);
      }
      disconnectSocket();
      reset();
    };
  }, [roomId]);

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

  // 当城市景点加载后，显示在地图上
  useEffect(() => {
    if (isMapLoaded && citySpots.length > 0) {
      clearAllMarkers();
      citySpots.forEach((spot) => {
        addSpotMarker(spot);
      });
    }
  }, [isMapLoaded, citySpots, clearAllMarkers, addSpotMarker]);

  // 当地图加载完成且有目的地时，定位到城市
  useEffect(() => {
    if (isMapLoaded && destination) {
      // 延迟一点确保地图完全初始化
      const timer = setTimeout(() => {
        setCityWithBoundary(destination);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isMapLoaded, destination, setCityWithBoundary]);

  // 当路线改变时，重新绘制
  useEffect(() => {
    if (isMapLoaded && routeSpots.length > 0) {
      clearRoute();
      const points: RoutePoint[] = routeSpots.map((spot) => {
        const [lng, lat] = spot.location.split(',').map(Number);
        return {
          spotId: spot.id,
          lng,
          lat,
          order: spot.order,
        };
      });
      drawRoute(points);
    }
  }, [isMapLoaded, routeSpots, clearRoute, drawRoute]);

  const loadRoomData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 加载房间信息
      const roomResponse = await getCollabRoomInfo(roomId!);
      if (roomResponse.success) {
        setCurrentRoom(roomResponse.data);
        setMembers(roomResponse.data.members || []);
        
        // 加载城市景点
        if (roomResponse.data.trip?.destination) {
          const dest = roomResponse.data.trip.destination;
          setDestination(dest);
          
          const spotsResponse = await getCitySpots(dest, 50);
          if (spotsResponse.success && spotsResponse.data) {
            const spots: Spot[] = spotsResponse.data.map((s: any) => ({
              id: s.id,
              name: s.name,
              location: s.location,
              category: s.category,
            }));
            setCitySpots(spots);
          }
        }
      }

      // 加载我的草案
      const draftsResponse = await getUserDrafts(roomId!);
      if (draftsResponse.success) {
        setMyDrafts(draftsResponse.data);
        
        // 恢复当前天的草案
        const currentDraft = draftsResponse.data.find((d) => d.dayNumber === currentDay);
        if (currentDraft) {
          const spotIds: string[] = JSON.parse(currentDraft.spotSequence);
          const routeSpotsFromDraft: RouteSpot[] = spotIds.map((id, index) => {
            const spot = citySpots.find((s) => s.id === id);
            return {
              id,
              name: spot?.name || '',
              location: spot?.location || '',
              order: index + 1,
            };
          });
          setRouteSpots(routeSpotsFromDraft);
        }
      }

      // 加载消息
      const messagesResponse = await getCollabMessages(roomId!);
      if (messagesResponse.success) {
        setMessages(messagesResponse.data);
      }

      // 连接Socket.io
      connectSocket(token);
      
      // 加入房间
      setTimeout(() => {
        joinRoom(roomId!, currentUser.id);
      }, 500);
      
    } catch (err: any) {
      console.error('加载房间数据失败:', err);
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  // 当天数切换时，加载对应的草案
  useEffect(() => {
    if (!roomId || !currentRoom) return;
    
    const loadDayDraft = async () => {
      try {
        const draftsResponse = await getUserDrafts(roomId);
        if (draftsResponse.success) {
          setMyDrafts(draftsResponse.data);
          
          // 加载当前天的草案
          const currentDraft = draftsResponse.data.find((d) => d.dayNumber === currentDay);
          if (currentDraft) {
            const spotIds: string[] = JSON.parse(currentDraft.spotSequence);
            const routeSpotsFromDraft: RouteSpot[] = spotIds.map((id, index) => {
              const spot = citySpots.find((s) => s.id === id);
              return {
                id,
                name: spot?.name || '',
                location: spot?.location || '',
                order: index + 1,
              };
            });
            setRouteSpots(routeSpotsFromDraft);
            
            // 绘制路线
            clearRoute();
            if (routeSpotsFromDraft.length > 0) {
              const routePoints: RoutePoint[] = routeSpotsFromDraft.map((s, index) => {
                const [lng, lat] = s.location.split(',').map(Number);
                return { 
                  spotId: s.id,
                  lng, 
                  lat,
                  order: index + 1,
                };
              });
              drawRoute(routePoints);
            }
          } else {
            // 没有草案，清空路线
            setRouteSpots([]);
            clearRoute();
          }
        }
      } catch (err) {
        console.error('加载天数草案失败:', err);
      }
    };
    
    loadDayDraft();
  }, [currentDay, roomId, currentRoom, citySpots]);

  // 处理景点点击
  function handleSpotClick(spot: Spot) {
    // 检查是否已在路线中
    const exists = routeSpots.find((s) => s.id === spot.id);
    if (exists) {
      // 移除
      setRouteSpots(routeSpots.filter((s) => s.id !== spot.id));
    } else {
      // 添加
      setRouteSpots([
        ...routeSpots,
        {
          id: spot.id,
          name: spot.name,
          location: spot.location,
          order: routeSpots.length + 1,
        },
      ]);
    }
    
    // 自动保存草案
    saveDraft();
  }

  // 保存草案
  const saveDraft = useCallback(() => {
    if (!roomId || !currentRoom || currentRoom.phase === 'LOCKED') return;
    
    const spotSequence = routeSpots.map((s) => s.id);
    const polylineData = routeSpots.map((s) => {
      const [lng, lat] = s.location.split(',').map(Number);
      return { lng, lat };
    });
    
    upsertDraft(roomId, currentDay, spotSequence, polylineData);
    
    // 通过WebSocket通知其他人
    updateDraft(roomId, currentUser.id, currentDay, spotSequence, polylineData);
  }, [roomId, currentRoom, currentDay, routeSpots, currentUser.id]);

  // 处理路线改变
  const handleRouteSpotsChange = (newSpots: RouteSpot[]) => {
    setRouteSpots(newSpots);
    saveDraft();
  };

  // 提交草案
  const handleSubmitDraft = async () => {
    if (!roomId) return;
    
    try {
      // 先保存
      saveDraft();
      
      // 获取当前草案ID
      const draftsResponse = await getUserDrafts(roomId);
      if (draftsResponse.success) {
        const currentDraft = draftsResponse.data.find((d) => d.dayNumber === currentDay);
        if (currentDraft) {
          await submitDraft(currentDraft.id);
          alert('路线已提交！');
        }
      }
    } catch (err) {
      console.error('提交草案失败:', err);
    }
  };

  const handleLoadSpotStats = async () => {
    if (!roomId) return;
    
    try {
      const response = await getSpotStats(roomId);
      if (response.success) {
        setSpotStats(response.data);
        setStatsData(response.data);
        
        // 显示统计
        const statsMap = new Map<string, number>();
        response.data.forEach((stat) => {
          statsMap.set(stat.id, stat.count);
        });
        displaySpotStats(statsMap);
        setShowStats(true);
      }
    } catch (err) {
      console.error('加载景点统计失败:', err);
    }
  };

  const handleHideSpotStats = () => {
    hideSpotStats();
    setShowStats(false);
  };

  const handleLockRoom = async () => {
    if (!roomId || !confirm('确定要锁定房间吗？锁定后所有成员都无法再修改草案。')) return;
    
    try {
      const response = await lockCollabRoom(roomId);
      if (response.success) {
        setCurrentRoom({
          ...currentRoom!,
          phase: 'LOCKED',
        });
        
        // 锁定后显示所有成员的路线
        await showAllMemberRoutes();
      }
    } catch (err) {
      console.error('锁定房间失败:', err);
    }
  };

  // 显示所有成员的路线
  const showAllMemberRoutes = async () => {
    if (!roomId || !isMapLoaded) return;
    
    try {
      const response = await getAllDrafts(roomId);
      if (response.success && response.data) {
        // 保存所有草案数据
        setAllMemberDrafts(response.data);
        setShowAllRoutes(true);
        
        // 清除现有路线
        clearRoute();
        
        // 定义颜色数组
        const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
        
        // 为每个成员绘制所有天的路线
        response.data.forEach((memberDrafts: any, index: number) => {
          const color = colors[index % colors.length];
          
          // 绘制该成员的所有天的路线
          memberDrafts.drafts.forEach((draft: any) => {
            const spotIds: string[] = JSON.parse(draft.spotSequence);
            const points: RoutePoint[] = spotIds.map((id, order) => {
              const spot = citySpots.find(s => s.id === id);
              if (spot) {
                const [lng, lat] = spot.location.split(',').map(Number);
                return { spotId: id, lng, lat, order: order + 1 };
              }
              return null;
            }).filter(Boolean) as RoutePoint[];
            
            if (points.length > 1) {
              drawRoute(points, color);
            }
          });
        });
      }
    } catch (err) {
      console.error('加载所有路线失败:', err);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (!roomId || !messageInput.trim()) return;
    
    try {
      const response = await sendCollabMessage(roomId, messageInput.trim());
      if (response.success) {
        // 不本地添加消息，等待Socket.io广播
        // addMessage(response.data);
        setMessageInput('');
      }
    } catch (err) {
      console.error('发送消息失败:', err);
    }
  };

  const handleShowAllLayers = () => {
    setVisibleLayers(new Set(members.map((m) => m.userId)));
  };

  const handleHideAllLayers = () => {
    setVisibleLayers(new Set());
  };

  const isHost = currentRoom?.hostId === currentUser.id;
  const isLocked = currentRoom?.phase === 'LOCKED';

  if (loading) {
    return (
      <div className="min-h-screen bg-livetrip-background flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-12 w-12 animate-spin mx-auto mb-4 text-livetrip-primary" />
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-livetrip-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/my-trips')}
            className="px-4 py-2 bg-livetrip-primary text-white rounded-lg"
          >
            返回我的行程
          </button>
        </div>
      </div>
    );
  }

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
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-gray-900">
              {currentRoom?.trip?.title || '协同规划'}
            </h1>
            {isLocked && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded flex items-center gap-1">
                <Lock className="h-3 w-3" />
                已锁定
              </span>
            )}
          </div>
          
          {/* 天数切换 */}
          <div className="flex items-center gap-2">
            {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => (
              <button
                key={day}
                onClick={() => setCurrentDay(day)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  currentDay === day
                    ? 'bg-livetrip-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Day {day}
              </button>
            ))}
          </div>
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
      <main className={`pt-14 ${isLargeScreen ? 'pl-[240px]' : ''} min-h-screen flex`}>
        {/* 左侧：地图区域 */}
        <div className="flex-1 p-4 flex flex-col">
          <div className="bg-white rounded-lg border border-border shadow-sm flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-livetrip-primary" />
                  第 {currentDay} 天路线规划
                </h3>
                <div className="flex items-center gap-2">
                  {showStats && (
                    <button
                      onClick={handleHideSpotStats}
                      className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      隐藏统计
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* 地图容器 */}
            <div id="collab-map" className="flex-1 relative">
              {!isMapLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                  <Loader className="h-8 w-8 animate-spin text-livetrip-primary" />
                </div>
              )}
            </div>
          </div>
          
          {/* 路线编辑器 */}
          <div className="mt-4 bg-white rounded-lg border border-border shadow-sm p-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-livetrip-primary" />
              路线顺序
            </h4>
            <RouteEditor
              spots={routeSpots}
              onSpotsChange={handleRouteSpotsChange}
              onSubmit={handleSubmitDraft}
              isLocked={isLocked}
            />
          </div>
        </div>

        {/* 右侧：信息区域 */}
        <div className="w-[360px] border-l border-border bg-white flex flex-col">
          {/* 图层控制 */}
          <div className="p-4 border-b border-border">
            <LayerControl
              members={members}
              visibleLayers={visibleLayers}
              onToggleLayer={toggleLayer}
              onShowAll={handleShowAllLayers}
              onHideAll={handleHideAllLayers}
            />
          </div>

          {/* 成员列表 */}
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Users className="h-5 w-5 text-livetrip-primary" />
              成员 ({members.length})
            </h3>
            <div className="space-y-2 max-h-[150px] overflow-y-auto">
              {members.map((member) => (
                <div key={member.id} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50">
                  <div className="w-8 h-8 rounded-full bg-livetrip-primary/10 flex items-center justify-center">
                    {member.user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{member.user.username}</p>
                    <p className="text-xs text-gray-500">
                      {member.role === 'HOST' ? '主持人' : '协作者'}
                    </p>
                  </div>
                  {onlineUsers.has(member.userId) && (
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 消息频道 */}
          <div className="flex-1 flex flex-col border-b border-border min-h-0">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-livetrip-primary" />
                建议频道
              </h3>
            </div>
            
            <div ref={messageListRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <p className="text-center text-gray-500 text-sm py-8">暂无消息</p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.userId === currentUser.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] ${msg.userId === currentUser.id ? 'order-2' : ''}`}>
                      {msg.userId !== currentUser.id && (
                        <p className="text-xs text-gray-500 mb-1">{msg.user.username}</p>
                      )}
                      <div
                        className={`px-3 py-2 rounded-lg text-sm ${
                          msg.userId === currentUser.id
                            ? 'bg-livetrip-primary text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-border">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="输入建议..."
                  className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-livetrip-primary/20"
                />
                <button
                  type="submit"
                  className="p-2 bg-livetrip-primary text-white rounded-lg hover:bg-livetrip-primary/90"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>

          {/* 操作区域 */}
          <div className="p-4 space-y-2">
            {/* 邀请链接 */}
            {isHost && inviteLink && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Share2 className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">邀请链接</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inviteLink}
                    readOnly
                    className="flex-1 px-2 py-1.5 text-xs bg-white border border-blue-300 rounded text-gray-700"
                  />
                  <button
                    onClick={handleCopyInviteLink}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3" />
                        已复制
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        复制
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-blue-700 mt-2">
                  分享此链接邀请朋友加入协同规划
                </p>
              </div>
            )}
            
            {isHost && (
              <>
                <button
                  onClick={showStats ? handleHideSpotStats : handleLoadSpotStats}
                  className="w-full py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  {showStats ? '隐藏景点统计' : '查看景点统计'}
                </button>
                
                {!isLocked && (
                  <button
                    onClick={handleLockRoom}
                    className="w-full py-2.5 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900 transition-colors flex items-center justify-center gap-2"
                  >
                    <Lock className="h-4 w-4" />
                    锁定行程
                  </button>
                )}
                
                {/* 锁定后显示所有路线和最终路线绘制 */}
                {isLocked && (
                  <>
                    <button
                      onClick={showAllRoutes ? () => {
                        setShowAllRoutes(false);
                        clearRoute();
                      } : showAllMemberRoutes}
                      className="w-full py-2.5 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      {showAllRoutes ? '隐藏所有路线' : '查看所有路线'}
                    </button>
                    
                    {/* 路线图例 */}
                    {showAllRoutes && allMemberDrafts.length > 0 && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <h4 className="text-xs font-semibold text-gray-700 mb-2">路线图例</h4>
                        <div className="space-y-1">
                          {allMemberDrafts.map((member: any, index: number) => {
                            const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
                            return (
                              <div key={member.userId} className="flex items-center gap-2">
                                <div 
                                  className="w-4 h-1 rounded"
                                  style={{ backgroundColor: colors[index % colors.length] }}
                                />
                                <span className="text-xs text-gray-600">{member.username}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    <button
                      onClick={() => alert('最终路线保存功能开发中...\n\n房主可以基于所有成员的建议，在地图上绘制最终路线，然后保存为正式行程。')}
                      className="w-full py-2.5 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <MapPin className="h-4 w-4" />
                      绘制最终路线
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </main>
      
      {/* 景点统计面板 */}
      {showStats && (
        <SpotStatsPanel
          stats={statsData}
          onClose={handleHideSpotStats}
        />
      )}
    </div>
  );
}
