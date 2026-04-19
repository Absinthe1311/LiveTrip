// 协同编辑主页面 - 多人协同规划行程的核心界面（集成地图功能）
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Menu, Users, MessageCircle, MapPin, Send, Lock, Eye, Loader, Copy, Check, Share2 } from 'lucide-react';
import GlobalSidebar from '../../components/layout/GlobalSidebar';
import { useCollabStore } from '../../store/collabStore';
import { getCollabRoomInfo, getUserDrafts, getCollabMessages, getSpotStats, lockCollabRoom, sendCollabMessage, upsertDraft, submitDraft, getCitySpots, getAllDrafts, saveFinalTrip } from '../../api/collabApi';
import { connectSocket, disconnectSocket, joinRoom, leaveRoom, updateDraft } from '../../services/collabSocket';
import { useCollabMap, Spot, RoutePoint } from '../../hooks/useCollabMap';
import LayerControl from '../../components/collab/LayerControl';
import RouteEditor, { RouteSpot } from '../../components/collab/RouteEditor';
import SpotStatsPanel from '../../components/collab/SpotStatsPanel';
import DayRoutePlanner from '../../components/collab/DayRoutePlanner';
import MapCopyright from '../../components/map/MapCopyright';

export default function CollabRoom() {
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
  const [rightPanelOpen, setRightPanelOpen] = useState(true); // 右侧面板显示状态
  
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

  // 提前定义isHost和isLocked，避免在useEffect中使用时未初始化
  const isHost = currentRoom?.hostId === currentUser.id;
  const isLocked = currentRoom?.phase === 'LOCKED';

  // 地图Hook
  const {
    addSpotMarker,
    clearAllMarkers,
    drawRoute,
    clearRoute,
    showSpotStats: displaySpotStats,
    hideSpotStats,
    setCityWithBoundary,
    updateSpotMarkerStyle,
    isLoaded: isMapLoaded,
  } = useCollabMap({
    containerId: 'collab-map',
    onSpotClick: handleSpotClick,
    isLocked: isLocked,
    enabled: !loading && !error,
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

  // 监听草案提交事件，实时更新路线图
  useEffect(() => {
    const handleDraftSubmitted = async (event: any) => {
      if (!roomId) return;

      try {
        // 使用事件中的数据或重新加载
        const draftsData = event?.detail || null;

        if (draftsData) {
          setAllMemberDrafts(draftsData);
        } else {
          // 重新加载所有成员的草案
          const response = await getAllDrafts(roomId);
          if (response.success) {
            setAllMemberDrafts(response.data);
          }
        }
      } catch (err) {
        console.error('重新加载草案失败:', err);
      }
    };

    // 监听自定义事件
    window.addEventListener('draft-submitted', handleDraftSubmitted);

    return () => {
      window.removeEventListener('draft-submitted', handleDraftSubmitted);
    };
  }, [roomId]);

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

  // 锁定后自动显示所有成员的路线并高亮景点
  useEffect(() => {
    if (isLocked && allMemberDrafts.length > 0 && isMapLoaded && members.length > 0 && citySpots.length > 0) {
      // 自动显示所有成员的路线
      const allUserIds = new Set(members.map((m) => m.userId));
      setVisibleLayers(allUserIds);

      // 如果还没有加载所有草案，先加载
      if (allMemberDrafts.length === 0) {
        showAllMemberRoutes();
      } else {
        // 已经有数据，直接绘制
        drawRoutesForDay(currentDay, allUserIds);
      }

      // 延迟一点确保地图标记已加载，然后高亮所有待选景点（绿色）
      setTimeout(() => {
        highlightCandidateSpots();
      }, 500);
    }
  }, [isLocked, allMemberDrafts, isMapLoaded, members, currentDay, citySpots]);

  // 高亮待选景点（所有成员选择的景点）
  const highlightCandidateSpots = useCallback(() => {
    if (!allMemberDrafts || allMemberDrafts.length === 0) return;

    // 收集所有成员选择的景点ID
    const candidateSpotIds = new Set<string>();

    allMemberDrafts.forEach((memberDraft: any) => {
      memberDraft.drafts.forEach((draft: any) => {
        const spotIds: string[] = JSON.parse(draft.spotSequence || '[]');
        spotIds.forEach((id) => candidateSpotIds.add(id));
      });
    });

    // 将所有待选景点标记为绿色
    candidateSpotIds.forEach((spotId) => {
      updateSpotMarkerStyle(spotId, 'candidate');
    });
  }, [allMemberDrafts, updateSpotMarkerStyle]);

  // 高亮最终路线景点（红色）
  const highlightSelectedSpots = useCallback((selectedSpotIds: string[]) => {
    // 先将所有景点恢复为待选状态（绿色）
    highlightCandidateSpots();

    // 然后将最终选择的景点标记为红色
    selectedSpotIds.forEach((spotId) => {
      updateSpotMarkerStyle(spotId, 'selected');
    });
  }, [highlightCandidateSpots, updateSpotMarkerStyle]);

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
      setTimeout(async () => {
        joinRoom(roomId!, currentUser.id);
        
        // 加入后立即获取最新的成员列表
        try {
          const roomResponse = await getCollabRoomInfo(roomId!);
          if (roomResponse.success) {
            setMembers(roomResponse.data.members || []);
          }
        } catch (error) {
          console.error('获取成员列表失败:', error);
        }
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
    
    // 如果房间已锁定，不加载草案（避免覆盖最终路线）
    if (currentRoom.phase === 'LOCKED') return;
    
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
    // 检查房间是否已锁定
    if (currentRoom?.phase === 'LOCKED') {
      return; // 锁定后不允许操作
    }
    
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
        
        // 设置所有成员为可见
        setVisibleLayers(new Set(response.data.map((d: any) => d.userId)));
        
        // 绘制当前天的路线
        drawRoutesForDay(currentDay);
      }
    } catch (err) {
      console.error('加载所有路线失败:', err);
    }
  };
  
  // 绘制指定天的所有成员路线
  const drawRoutesForDay = (day: number, layersToDraw?: Set<string>) => {
    if (!isMapLoaded || allMemberDrafts.length === 0) return;
    
    // 使用传入的图层或当前store中的图层
    const layers = layersToDraw || visibleLayers;
    
    // 清除现有路线
    clearRoute();
    
    // 定义颜色数组 - 使用更鲜明、更易区分的颜色
    const colors = [
      '#3B82F6', // 蓝色
      '#EF4444', // 红色
      '#10B981', // 绿色
      '#F59E0B', // 橙色
      '#8B5CF6', // 紫色
      '#EC4899', // 粉色
      '#06B6D4', // 青色
      '#84CC16', // 黄绿色
      '#F97316', // 深橙色
      '#6366F1', // 靛蓝色
    ];
    
    // 为每个成员绘制指定天的路线
    allMemberDrafts.forEach((memberDrafts: any, index: number) => {
      // 只绘制可见成员的路线
      if (!layers.has(memberDrafts.userId)) return;
      
      const color = colors[index % colors.length];
      
      // 找到该天的草案
      const draft = memberDrafts.drafts.find((d: any) => d.dayNumber === day);
      if (draft) {
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
      }
    });
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
    // 设置所有成员为可见
    const allUserIds = new Set(members.map((m) => m.userId));
    setVisibleLayers(allUserIds);
    
    // 如果还没有加载所有草案，先加载
    if (allMemberDrafts.length === 0) {
      showAllMemberRoutes();
    } else {
      // 已经有数据，直接绘制（传入新的图层集合）
      drawRoutesForDay(currentDay, allUserIds);
    }
  };

  const handleHideAllLayers = () => {
    // 清除所有可见状态
    setVisibleLayers(new Set());
    // 清除地图上的路线
    clearRoute();
  };
  
  // 切换单个成员的路线显示
  const handleToggleLayer = (userId: string) => {
    const newSet = new Set(visibleLayers);
    const isCurrentlyVisible = newSet.has(userId);
    
    if (isCurrentlyVisible) {
      // 当前可见，切换为隐藏
      newSet.delete(userId);
    } else {
      // 当前隐藏，切换为显示
      newSet.add(userId);
    }
    
    setVisibleLayers(newSet);
    
    // 重新绘制路线（传入新的图层集合）
    if (newSet.size > 0 && allMemberDrafts.length > 0) {
      drawRoutesForDay(currentDay, newSet);
    } else {
      clearRoute();
    }
  };
  
  // 保存最终路线
  const handleSaveFinalRoute = async (route: any[]) => {
    if (!roomId) return;
    
    try {
      // 调用后端API保存最终行程
      const response = await saveFinalTrip(roomId, route);
      
      if (response.success) {
        alert('✅ 危同行程已保存！\n\n您可以在"我的行程"中查看协同行程。');
        // 跳转到我的行程页面
        navigate('/my-trips');
      } else {
        throw new Error(response.error || '保存失败');
      }
    } catch (err: any) {
      console.error('保存最终路线失败:', err);
      alert('❌ 保存失败：' + (err.message || '请重试'));
    }
  };
  
  // 处理最终路线变化（实时在地图上显示）
  const handleFinalRouteChange = (route: any[]) => {
    if (!isMapLoaded || route.length === 0) {
      clearRoute();
      return;
    }

    // 清除现有路线
    clearRoute();

    // 高亮最终选择的景点（红色）
    const selectedSpotIds = route.map((spot) => spot.id);
    highlightSelectedSpots(selectedSpotIds);

    // 绘制最终路线（使用橙色）
    const points: RoutePoint[] = route.map((spot, index) => {
      const [lng, lat] = spot.location.split(',').map(Number);
      return {
        spotId: spot.id,
        lng,
        lat,
        order: index + 1,
      };
    });

    drawRoute(points, '#EF4444'); // 红色
  };

  if (loading) {
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
        
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader className="h-12 w-12 animate-spin mx-auto mb-4 text-amber-400" />
            <p className="text-white/70">加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
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
        
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl p-8">
            <p className="text-red-400 mb-6">{error}</p>
            <button
              onClick={() => navigate('/my-trips')}
              className="px-8 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-amber-500/40 hover:scale-105 active:scale-95 transition-all duration-300 border border-white/20"
            >
              返回我的行程
            </button>
          </div>
        </div>
      </div>
    );
  }

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

      {/* 全局侧边栏 */}
      <GlobalSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Top Navbar - 协同规划专用 */}
      <header className={`fixed top-0 right-0 h-14 bg-white/5 backdrop-blur-md border-b border-white/10 z-40 flex items-center transition-all duration-300 ${
        sidebarOpen ? 'left-[15%]' : 'left-0'
      }`}>
        <div className="flex-1 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            {/* 移动端菜单按钮 */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors lg:hidden"
            >
              <Menu className="h-5 w-5 text-white" />
            </button>

            <h1 className="text-lg font-semibold text-white">
              {currentRoom?.trip?.title || '协同规划'}
            </h1>
            {isLocked && (
              <span className="px-2 py-1 bg-white/10 text-white/80 text-xs rounded flex items-center gap-1 border border-white/20">
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
                onClick={() => {
                  setCurrentDay(day);
                  // 如果正在显示所有路线，重新绘制该天的路线
                  if (showAllRoutes) {
                    drawRoutesForDay(day);
                  }
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  currentDay === day
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30 border border-white/20'
                    : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white border border-white/20'
                }`}
              >
                Day {day}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`pt-14 min-h-screen flex relative z-10 transition-all duration-300 ${
        sidebarOpen ? 'ml-[15%]' : ''
      }`}>
        {/* 左侧：地图区域 */}
        <div className="flex-1 p-4 flex flex-col">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2 text-white">
                  <MapPin className="h-5 w-5 text-amber-400" />
                  第 {currentDay} 天路线规划
                </h3>
                <div className="flex items-center gap-2">
                  {/* 右侧面板切换按钮 */}
                  <button
                    onClick={() => setRightPanelOpen(!rightPanelOpen)}
                    className="px-3 py-1.5 text-xs bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors flex items-center gap-1.5 border border-blue-500/30 font-medium"
                  >
                    {rightPanelOpen ? (
                      <>
                        <Eye className="h-3.5 w-3.5" />
                        隐藏信息面板
                      </>
                    ) : (
                      <>
                        <Eye className="h-3.5 w-3.5" />
                        显示信息面板
                      </>
                    )}
                  </button>
                  {showStats && (
                    <button
                      onClick={handleHideSpotStats}
                      className="px-3 py-1.5 text-xs bg-white/10 text-white/80 rounded-lg hover:bg-white/20 transition-colors border border-white/20"
                    >
                      隐藏统计
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* 地图容器 */}
            <div id="collab-map" className="flex-1 relative">
              {/* 高德地图审图号 */}
              <MapCopyright position="bottom-right" />
              {!isMapLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <Loader className="h-8 w-8 animate-spin text-amber-400" />
                </div>
              )}
            </div>
          </div>
          
          {/* 路线编辑器 */}
          <div className="mt-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl p-4">
            <h4 className="font-medium mb-3 flex items-center gap-2 text-white">
              <MapPin className="h-4 w-4 text-amber-400" />
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
        {rightPanelOpen && (
          <div className="w-[400px] border-l border-white/10 bg-white/5 backdrop-blur-md flex flex-col">
            {/* 面板头部 */}
            <div className="p-3 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">信息面板</h3>
              <button
                onClick={() => setRightPanelOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                title="隐藏面板"
              >
                <Eye className="h-4 w-4" />
              </button>
            </div>

            {/* 图层控制 */}
            <div className="p-4 border-b border-white/10">
              <LayerControl
                members={members}
                visibleLayers={visibleLayers}
                onToggleLayer={handleToggleLayer}
                onShowAll={handleShowAllLayers}
                onHideAll={handleHideAllLayers}
              />
            </div>

          {/* 成员列表 */}
          <div className="p-4 border-b border-white/10">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-white">
              <Users className="h-5 w-5 text-amber-400" />
              成员 ({members.length})
            </h3>
            <div className="space-y-2 max-h-[150px] overflow-y-auto">
              {members.map((member) => (
                <div key={member.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/20 flex items-center justify-center border border-white/20">
                    {member.user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{member.user.username}</p>
                    <p className="text-xs text-white/60">
                      {member.role === 'HOST' ? '主持人' : '协作者'}
                    </p>
                  </div>
                  {onlineUsers.has(member.userId) && (
                    <span className="w-2 h-2 rounded-full bg-green-400 shadow-lg shadow-green-400/50"></span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 消息频道 */}
          <div className="flex-1 flex flex-col border-b border-white/10 min-h-0">
            <div className="p-4 border-b border-white/10">
              <h3 className="font-semibold flex items-center gap-2 text-white">
                <MessageCircle className="h-5 w-5 text-amber-400" />
                建议频道
              </h3>
            </div>
            
            <div ref={messageListRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <p className="text-center text-white/60 text-sm py-8">暂无消息</p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.userId === currentUser.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] ${msg.userId === currentUser.id ? 'order-2' : ''}`}>
                      {msg.userId !== currentUser.id && (
                        <p className="text-xs text-white/60 mb-1">{msg.user.username}</p>
                      )}
                      <div
                        className={`px-3 py-2 rounded-xl text-sm backdrop-blur-md border ${
                          msg.userId === currentUser.id
                            ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-white border-amber-500/30'
                            : 'bg-white/10 text-white/80 border-white/20'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-white/10">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="输入建议..."
                  className="flex-1 px-4 py-2 border border-white/20 rounded-xl bg-white/10 backdrop-blur-md text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:shadow-[0_0_20px_rgba(245,158,11,0.3)] text-sm transition-all duration-300"
                />
                <button
                  type="submit"
                  className="p-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:shadow-lg hover:shadow-amber-500/40 hover:scale-105 active:scale-95 transition-all duration-300 border border-white/20"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>

          {/* 操作区域 */}
          <div className="p-4 space-y-3">
            {/* 邀请链接 */}
            {isHost && inviteLink && (
              <div className="bg-blue-500/10 backdrop-blur-md border border-blue-500/20 rounded-xl p-4 mb-3">
                <div className="flex items-center gap-2 mb-3">
                  <Share2 className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-medium text-blue-300">邀请链接</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inviteLink}
                    readOnly
                    className="flex-1 px-3 py-2 text-xs bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white/80"
                  />
                  <button
                    onClick={handleCopyInviteLink}
                    className="px-3 py-2 bg-blue-500/20 text-blue-300 rounded-lg text-xs font-medium hover:bg-blue-500/30 transition-colors flex items-center gap-1 border border-blue-500/30"
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
                <p className="text-xs text-blue-300/80 mt-3">
                  分享此链接邀请朋友加入协同规划
                </p>
              </div>
            )}
            
            {isHost && (
              <>
                <button
                  onClick={showStats ? handleHideSpotStats : handleLoadSpotStats}
                  className="w-full py-3 bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-300 rounded-xl font-medium hover:bg-blue-500/30 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 flex items-center justify-center gap-2 border border-blue-500/30"
                >
                  <Eye className="h-4 w-4" />
                  {showStats ? '隐藏景点统计' : '查看景点统计'}
                </button>
                
                {!isLocked && (
                  <button
                    onClick={handleLockRoom}
                    className="w-full py-3 bg-gradient-to-r from-gray-700/80 to-gray-800/80 text-white rounded-xl font-medium hover:bg-gray-700 hover:shadow-lg hover:shadow-gray-500/20 transition-all duration-300 flex items-center justify-center gap-2 border border-white/20"
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
                      className="w-full py-3 bg-gradient-to-r from-purple-500/20 to-purple-600/20 text-purple-300 rounded-xl font-medium hover:bg-purple-500/30 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 flex items-center justify-center gap-2 border border-purple-500/30"
                    >
                      <Eye className="h-4 w-4" />
                      {showAllRoutes ? '隐藏所有路线' : '查看所有路线'}
                    </button>
                    
                    {/* 路线图例 */}
                    {showAllRoutes && allMemberDrafts.length > 0 && (
                      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4">
                        <h4 className="text-xs font-semibold text-white/80 mb-3">路线图例</h4>
                        <div className="space-y-2">
                          {allMemberDrafts.map((member: any, index: number) => {
                            const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
                            return (
                              <div key={member.userId} className="flex items-center gap-2">
                                <div 
                                  className="w-4 h-1 rounded"
                                  style={{ backgroundColor: colors[index % colors.length] }}
                                />
                                <span className="text-xs text-white/70">{member.username}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
        )}

        {/* 右侧面板隐藏时的浮动显示按钮 */}
        {!rightPanelOpen && (
          <button
            onClick={() => setRightPanelOpen(true)}
            className="fixed right-0 top-1/2 -translate-y-1/2 z-30 bg-blue-500/90 hover:bg-blue-500 text-white px-2 py-4 rounded-l-lg shadow-lg transition-all duration-300 flex flex-col items-center gap-2 group"
            title="显示信息面板"
          >
            <Eye className="h-5 w-5" />
            <span className="text-xs font-medium writing-mode-vertical transform rotate-0 group-hover:scale-105 transition-transform">
              信息
            </span>
          </button>
        )}
      </main>
      
      {/* 景点统计面板 */}
      {showStats && (
        <SpotStatsPanel
          stats={statsData}
          onClose={handleHideSpotStats}
        />
      )}
      
      {/* 按天绘制最终路线（锁定后且房主可见） */}
      {isLocked && isHost && allMemberDrafts.length > 0 && (
        <DayRoutePlanner
          day={currentDay}
          allMemberDrafts={allMemberDrafts}
          citySpots={citySpots}
          onSave={handleSaveFinalRoute}
          onRouteChange={handleFinalRouteChange}
        />
      )}
    </div>
  );
}


