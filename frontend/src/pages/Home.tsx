// 首页 - LiveTrip 智能旅行规划（最终优化版）
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Home as HomeIcon, Plus, Sparkles, Globe, Heart, PenLine, List, MapPin, Users, Search, Bell, Settings, Sun, Image as ImageIcon, Upload, X } from "lucide-react";
import {
  GlassCard,
  PackingList,
  BudgetCard,
  WeatherCard,
  CalendarCard,
  UpcomingTourCard,
  LogoutButton,
  TotalTravelCard,
  MapWidget,
  SearchBar
} from '../components/home';
import ImageCropper from '../components/ImageCropper';
import LandingHeroSection from '../components/LandingHeroSection';
import UserProfileEditModal from '../components/UserProfileEditModal';
import { useHomepageData } from '../hooks/useHomepageData';

// ==================== 未登录态视图 ====================
function GuestView() {
  return <LandingHeroSection />;
}

// ==================== 已登录态工作台视图（最终优化版） ====================
function WorkspaceView() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  
  // 使用自定义Hook获取数据
  const {
    loading,
    error,
    packingItems,
    packingProgress,
    togglePacked,
    weatherData,
    selectedCity,
    changeCity,
    budgetData,
    tripStats,
    upcomingTrips,
    tripDates,
    currentTripId,
    footprintCities,
    hotDestinations,
    searchResults,
    search,
  } = useHomepageData();
  
  // 背景图更换功能状态
  const [bgImage, setBgImage] = useState<string>('/homepage-bg.jpg');
  const [showBgInput, setShowBgInput] = useState(false);
  const [bgUrl, setBgUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [cropperVisible, setCropperVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // 用户信息编辑弹窗
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  // 获取用户信息
  const fetchUserProfile = async () => {
    try {
      const response = await fetch('http://localhost:3003/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const result = await response.json();
      if (result.success) {
        setUserProfile(result.data);
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1280);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // 从 localStorage 读取保存的背景图
  useEffect(() => {
    const savedBg = localStorage.getItem('customBgImage');
    if (savedBg) {
      setBgImage(savedBg);
    }
  }, []);

  // 处理背景图更改
  const handleBgChange = () => {
    if (bgUrl.trim()) {
      setBgImage(bgUrl.trim());
      localStorage.setItem('customBgImage', bgUrl.trim());
      setShowBgInput(false);
      setBgUrl('');
    }
  };

  // 处理背景图上传
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('仅支持 JPG、PNG、GIF、WebP 格式的图片');
      return;
    }

    // 验证文件大小（10MB）
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('图片大小不能超过 10MB');
      return;
    }

    // 打开裁剪器
    setSelectedFile(file);
    setCropperVisible(true);
    setShowBgInput(false);
  };

  // 处理裁剪确认
  const handleCropConfirm = async (croppedImage: string) => {
    setUploading(true);
    try {
      // 将base64转换为Blob
      const response = await fetch(croppedImage);
      const blob = await response.blob();
      const file = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' });

      // 上传裁剪后的图片
      const formData = new FormData();
      formData.append('image', file);

      const uploadResponse = await fetch('http://localhost:3003/api/upload/image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      const result = await uploadResponse.json();

      if (result.success) {
        const imageUrl = result.data.url;
        setBgImage(imageUrl);
        localStorage.setItem('customBgImage', imageUrl);
        setPreviewUrl(imageUrl);
        setCropperVisible(false);
        setSelectedFile(null);
        alert('图片上传成功');
      } else {
        alert(result.error || '图片上传失败');
      }
    } catch (error) {
      console.error('背景图上传失败:', error);
      alert('图片上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  // 处理裁剪取消
  const handleCropCancel = () => {
    setCropperVisible(false);
    setSelectedFile(null);
  };

  // 删除上传的图片
  const handleRemoveImage = () => {
    setBgImage('/homepage-bg.jpg');
    setPreviewUrl('');
    localStorage.removeItem('customBgImage');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* 全屏背景 - 使用裁剪后的图片，完美铺满屏幕 */}
      <div
        className="fixed inset-0"
      >
        <img
          src={bgImage}
          alt="Background"
          className="w-full h-full object-cover"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
          }}
        />
      </div>

      {/* 背景遮罩 - 降低模糊度以提高清晰度 */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />

      {/* 主容器 */}
      <div className="relative min-h-screen flex">
        {/* 左侧导航栏 (15%) */}
        <aside
          className={`fixed left-0 top-0 bottom-0 w-[15%] min-w-[200px] max-w-[240px] bg-white/5 backdrop-blur-xl border-r border-white/20 z-40 flex flex-col transition-transform duration-300 ${
            isLargeScreen ? 'translate-x-0' : (sidebarOpen ? 'translate-x-0' : '-translate-x-full')
          }`}
        >
          {/* 品牌区 - 使用logo图片 */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-center cursor-pointer" onClick={() => navigate('/')}>
              <img
                src="/logo.png"
                alt="LiveTrip Logo"
                className="h-20 w-auto object-contain"
              />
            </div>
          </div>

          {/* 导航菜单 */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            {/* 主菜单 */}
            <div className="mb-4">
              <h3 className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/60">
                主菜单
              </h3>
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => { navigate('/'); setSidebarOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <HomeIcon className="h-4 w-4" />
                    <span>首页</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => { navigate('/plan'); setSidebarOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>创建行程</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => { navigate('/ai-features'); setSidebarOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>AI 功能</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => { navigate('/destinations'); setSidebarOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Globe className="h-4 w-4" />
                    <span>热门目的地</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => { navigate('/favorites'); setSidebarOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Heart className="h-4 w-4" />
                    <span>我的收藏</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* 社区 */}
            <div className="mb-4">
              <h3 className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/60">
                社区
              </h3>
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => { navigate('/blogs'); setSidebarOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <PenLine className="h-4 w-4" />
                    <span>旅行博客</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* 我的旅行 */}
            <div className="mb-4">
              <h3 className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/60">
                我的旅行
              </h3>
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => { navigate('/my-trips'); setSidebarOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <List className="h-4 w-4" />
                    <span>我的行程</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => { navigate('/today'); setSidebarOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <MapPin className="h-4 w-4" />
                    <span>当前行程</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => { navigate('/collab'); setSidebarOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Users className="h-4 w-4" />
                    <span>协同规划</span>
                  </button>
                </li>
              </ul>
            </div>
          </nav>

          {/* 背景图更换按钮（左下角） */}
          <div className="p-3 border-t border-white/10">
            <button
              onClick={() => setShowBgInput(!showBgInput)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ImageIcon className="h-4 w-4" />
              <span>更换背景</span>
            </button>

            {/* 背景图输入框 */}
            {showBgInput && (
              <div className="mt-2 space-y-2">
                {/* URL 输入 */}
                <div className="space-y-2">
                  <input
                    type="text"
                    value={bgUrl}
                    onChange={(e) => setBgUrl(e.target.value)}
                    placeholder="输入图片URL..."
                    className="w-full px-3 py-2 text-sm rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-white/30 transition-all"
                  />
                  <button
                    onClick={handleBgChange}
                    className="w-full px-3 py-1.5 text-xs font-medium rounded-lg bg-livetrip-primary text-white hover:bg-livetrip-primary/90 transition-colors"
                  >
                    应用 URL
                  </button>
                </div>

                {/* 分隔线 */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/20"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-white/5 text-white/50">或</span>
                  </div>
                </div>

                {/* 上传按钮 */}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="bg-upload-input-home"
                  ref={fileInputRef}
                />
                <label
                  htmlFor="bg-upload-input-home"
                  className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg bg-white/10 text-white/80 hover:bg-white/20 cursor-pointer transition-colors"
                >
                  <Upload className="w-3 h-3" />
                  上传本地图片
                </label>

                {/* 重置按钮 */}
                <button
                  onClick={handleRemoveImage}
                  className="w-full px-3 py-1.5 text-xs font-medium rounded-lg bg-white/5 text-white/60 hover:bg-white/10 transition-colors"
                >
                  重置为默认背景
                </button>
              </div>
            )}
          </div>

          {/* 退出按钮（左下角） */}
          <div className="p-3 border-t border-white/10">
            <LogoutButton />
          </div>
        </aside>

        {/* 中间核心区 (60%) - 包含用户信息和搜索 */}
        <main
          className={`flex-1 p-6 transition-all duration-300 ${
            isLargeScreen ? 'ml-[15%]' : ''
          }`}
        >
          <div className="max-w-full h-full flex flex-col">
            {/* 顶部栏 - 搜索框 */}
            <div className="mb-6">
              <GlassCard className="p-4">
                <div className="flex items-center gap-4">
                  {/* 搜索框 */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
                    <input
                      type="text"
                      placeholder="搜索目的地、景点、攻略…"
                      className="w-full h-10 pl-10 pr-4 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 outline-none focus:ring-2 focus:ring-white/30 transition-all"
                    />
                  </div>

                  {/* 功能图标组 */}
                  <div className="flex items-center gap-2">
                    {/* 通知按钮 */}
                    <button className="relative p-2 rounded-lg hover:bg-white/10 transition-colors">
                      <Bell className="h-5 w-5 text-white/80" />
                      <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    </button>

                    {/* 设置按钮 */}
                    <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                      <Settings className="h-5 w-5 text-white/80" />
                    </button>

                    {/* 主题切换按钮 - Light/Dark */}
                    <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 transition-colors">
                      <Sun className="h-4 w-4 text-white/80" />
                      <span className="text-xs font-medium text-white/80">Light</span>
                    </button>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* 第一行卡片 - 重新调整布局 */}
            <div className="grid grid-cols-3 gap-6 mb-4">
              {/* Packing List 卡片 - 缩短宽度 */}
              <div className="col-span-1">
                <PackingList 
                  packingItems={packingItems}
                  onItemToggle={togglePacked}
                  onPackingClick={() => currentTripId && navigate(`/trip/${currentTripId}`)}
                />
              </div>

              {/* Weather 卡片 - 放在中间 */}
              <WeatherCard 
                city={weatherData?.city}
                temperature={weatherData?.temperature}
                condition={weatherData?.condition}
                humidity={weatherData?.humidity}
                windSpeed={weatherData?.windSpeed}
                pressure={weatherData?.pressure}
              />

              {/* Budget 卡片 - 缩短高度 */}
              <BudgetCard 
                title="行程预算"
                totalBudget={budgetData?.total}
                budgetItems={budgetData ? [
                  { category: '交通', amount: budgetData.transportation, percentage: (budgetData.transportation / budgetData.total) * 100 || 0, color: 'bg-red-500' },
                  { category: '住宿', amount: budgetData.accommodation, percentage: (budgetData.accommodation / budgetData.total) * 100 || 0, color: 'bg-yellow-500' },
                  { category: '餐饮', amount: budgetData.food, percentage: (budgetData.food / budgetData.total) * 100 || 0, color: 'bg-blue-500' },
                  { category: '门票', amount: budgetData.tickets, percentage: (budgetData.tickets / budgetData.total) * 100 || 0, color: 'bg-green-500' },
                ] : undefined}
              />
            </div>

            {/* 第二行 - Most Visited 地图（大面积） */}
            <div className="flex-1">
              <GlassCard className="p-6 h-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">
                    旅行足迹
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <span>已探索</span>
                    <span className="text-lg font-bold text-white">{tripStats.totalCities}</span>
                    <span>个城市</span>
                  </div>
                </div>

                {/* 地图区域 */}
                <div className="flex-1 bg-white/5 rounded-lg flex items-center justify-center min-h-[400px]">
                  <div className="text-center">
                    <p className="text-4xl mb-4">🌍</p>
                    <p className="text-white/60 text-lg">
                      中国旅行地图
                    </p>
                    <p className="text-white/40 text-sm mt-2">
                      已完成 {tripStats.completedTrips} 次旅行，共 {tripStats.totalTrips} 个行程
                    </p>
                    <div className="mt-6 flex items-center justify-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                        <span className="text-white/60">已完成</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-green-500"></span>
                        <span className="text-white/60">进行中</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                        <span className="text-white/60">即将出行</span>
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        </main>

        {/* 右侧边栏 (25%) - 正确顺序 */}
        <aside
          className={`w-[25%] min-w-[300px] max-w-[400px] p-6 space-y-4 ${
            isLargeScreen ? 'block' : 'hidden'
          }`}
        >
          {/* 用户信息卡片 */}
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              {/* 头像 */}
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white text-lg font-semibold">
                {userProfile?.avatar ? (
                  <img src={userProfile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{userProfile?.nickname?.[0] || userProfile?.username?.[0] || 'U'}</span>
                )}
              </div>

              {/* 用户信息 */}
              <div className="flex-1">
                <div className="text-sm font-semibold text-white">
                  {userProfile?.nickname || userProfile?.username || '用户'}
                </div>
                <div className="text-xs text-white/60">
                  {userProfile?.bio || '这个人很懒，什么都没写'}
                </div>
              </div>

              {/* 编辑按钮 */}
              <button
                onClick={() => setEditModalOpen(true)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <PenLine className="h-4 w-4 text-white/60" />
              </button>
            </div>

            {/* 统计信息 */}
            <div className="mt-4 flex items-center justify-around text-center">
              <div>
                <div className="text-lg font-semibold text-white">{userProfile?.totalTrips || 0}</div>
                <div className="text-xs text-white/60">行程</div>
              </div>
              <div className="w-px h-8 bg-white/20"></div>
              <div>
                <div className="text-lg font-semibold text-white">{userProfile?.totalCities || 0}</div>
                <div className="text-xs text-white/60">城市</div>
              </div>
              <div className="w-px h-8 bg-white/20"></div>
              <div>
                <div className="text-lg font-semibold text-white">{userProfile?.completedTrips || 0}</div>
                <div className="text-xs text-white/60">已完成</div>
              </div>
            </div>
          </GlassCard>

          {/* 搜索栏 */}
          <SearchBar
            onSearch={search}
            hotDestinations={hotDestinations}
            searchResults={searchResults}
          />

          {/* 地图足迹 */}
          <MapWidget
            cities={footprintCities}
            onCityClick={(city) => {
              // 点击城市标记，跳转到该城市的第一个行程
              if (city.tripIds.length > 0) {
                navigate(`/trip/${city.tripIds[0]}`);
              }
            }}
          />

          {/* 月历组件 */}
          <CalendarCard 
            year={new Date().getFullYear()}
            month={new Date().getMonth() + 1}
            highlightedDates={tripDates.flatMap(trip => {
              const dates = [];
              const start = trip.startDate;
              const end = trip.endDate;
              for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                dates.push(d.getDate());
              }
              return dates;
            })}
          />

          {/* 即将出行 */}
          <UpcomingTourCard 
            tours={upcomingTrips.map(trip => ({
              id: trip.id,
              city: trip.destination,
              country: '中国',
              flag: '🇨🇳',
              date: new Date(trip.startDate).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
              temperature: 20,
              condition: '晴',
              onClick: () => navigate(`/trip/${trip.id}`),
            }))}
          />
        </aside>

        {/* 移动端遮罩 */}
        {sidebarOpen && !isLargeScreen && (
          <div
            className="fixed inset-0 bg-black/50 z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* 图片裁剪器 */}
        <ImageCropper
          visible={cropperVisible}
          imageFile={selectedFile}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />

        {/* 用户信息编辑弹窗 */}
        <UserProfileEditModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          profile={userProfile || {}}
          onUpdate={fetchUserProfile}
        />
      </div>
    </div>
  );
}

// ==================== 主组件 ====================
function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!user && !!token);
  }, []);

  return isLoggedIn ? <WorkspaceView /> : <GuestView />;
}

export default Home;
